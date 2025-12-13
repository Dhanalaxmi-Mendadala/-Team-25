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
          "warnings": ["any safety warnings if applicable"]
        }},
        ...
      ],
      "score": integer 0-100,
      "evaluation": {{
        "completeness": integer 0-100,
        "safety": integer 0-100,
        "ambiguity": "low / medium / high",
        "overall_rating": "Good / Moderate / Needs Correction"
      }}
    }}

    3. Rules:
       - Expand shorthand medicine names into full names if known.
       - Fill in missing dosage, frequency, timing, and duration if inferred from context, otherwise mark as "unknown" or leave blank appropriately.
       - Add warnings if medicine is unknown or dose seems unsafe.
       - If a 'Diagnosis' is provided in the text, use it to cross-check the prescribed medicines. Add warnings if a medicine seems contraindicated for the diagnosis or unrelated.
       - If 'Diagnosis' is present, check for standard treatments associated with it and consider this in the completeness score.
       - Respond ONLY in JSON.
       - Maintain field names exactly as specified.
    """

    try:
        response = model.generate_content(prompt)
        # Parse the response text as JSON
        json_response = json.loads(response.text)
        return json_response
    except json.JSONDecodeError:
        # Fallback or error handling if model returns malformed JSON
        return {
            "error": "Failed to parse AI response",
            "raw_response": response.text
        }
    except Exception as e:
        return {"error": str(e)}
