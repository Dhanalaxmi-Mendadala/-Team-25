import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("Gemini_AI_API_KEY")
if not API_KEY:
    raise ValueError("Gemini_AI_API_KEY not found in .env")

# DEBUG: Print first 5 chars of key to verify it changed
print(f"DEBUG: Loaded API Key starting with: {API_KEY[:5]}...")

genai.configure(api_key=API_KEY)

# Generation config to enforce JSON response
generation_config = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config=generation_config,
)

def analyze_prescription_text(text: str) -> dict:
    prompt = f"""
    You are a professional medical AI assistant. Analyze the following raw prescription text and return a structured, safe, and standardized JSON output. Follow these rules:

    1. Input:
       - Raw prescription text: "{text}"

    2. Output:
       - Always return valid JSON with this structure:
    {{
      "structured_prescription": [
        {{
          "medicine_name": "Full medicine name",
          "formulation": "tablet/capsule/syrup/etc.",
          "strength": "dosage, e.g., 500mg",
          "frequency": "once daily / twice daily / as prescribed",
          "timing": "before/after meals, morning/evening, etc.",
          "duration": "duration of treatment",
          "warnings": ["any safety warnings if applicable, including drug interactions"]
        }},
        ...
      ],
      "score": integer 0-100,
      "evaluation": {{
        "completeness": integer 0-100,
        "safety": integer 0-100,
        "ambiguity": "low / medium / high",
        "overall_rating": "Excellent / Good / Moderate / Needs Correction / Poor"
      }},
      "summary": "Brief 2-3 sentence summary of the prescription quality",
      "recommendations": ["List of specific improvements or precautions if any"],
      "drug_interactions": ["Identify any potential drug-drug interactions if multiple medicines"]
    }}

    3. Rules:
       - Expand shorthand medicine names into full names if known.
       - Fill in missing frequency, timing, and duration if inferred from context, otherwise mark as "unknown".
       - Add warnings if medicine is unknown or dose seems unsafe.
       - Check for drug-drug interactions if multiple medicines are prescribed.
       - If a 'Diagnosis' is provided in the text, use it to cross-check the prescribed medicines. Add warnings if a medicine seems contraindicated or unrelated.
       - Consider patient age and vitals in your safety assessment.
       - If 'Diagnosis' is present, check for standard treatments and consider this in the completeness score.
       - Score should be: 90-100 (Excellent), 80-89 (Good), 60-79 (Moderate), 40-59 (Needs Correction), 0-39 (Poor)
       - Respond ONLY in JSON.
       - Maintain field names exactly as specified.
    """

    try:
        response = model.generate_content(prompt)
        
        # Check if response is empty
        if not response or not response.text:
            return {"error": "AI returned empty response"}
        
        # Parse the response text as JSON
        json_response = json.loads(response.text)
        
        # Validate that required fields exist
        if "structured_prescription" not in json_response or "score" not in json_response:
            return {
                "error": "AI response missing required fields",
                "raw_response": response.text
            }
        
        # Ensure score is in valid range
        if "score" in json_response:
            json_response["score"] = max(0, min(100, json_response["score"]))
        
        return json_response
        
    except json.JSONDecodeError as e:
        # Fallback or error handling if model returns malformed JSON
        return {
            "error": f"Failed to parse AI response: {str(e)}",
            "raw_response": response.text if response else "No response"
        }
    except AttributeError as e:
        # Handle cases where response object doesn't have expected attributes
        return {"error": f"Invalid API response structure: {str(e)}"}
    except Exception as e:
        # Catch all other exceptions
        error_str = str(e)
        # Check for specific API key error
        if "403" in error_str or "leaked" in error_str.lower():
            return {"error": "403 Your API key was reported as leaked. Please use another API key."}
        return {"error": f"AI service error: {error_str}"}
