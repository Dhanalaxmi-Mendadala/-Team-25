import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional


load_dotenv()

API_KEY = os.getenv("Gemini_AI_API_KEY")
if not API_KEY:
    raise ValueError("Gemini_AI_API_KEY not found in .env")

# DEBUG: Print first 5 chars of key to verify it changed
print(f"DEBUG: Loaded API Key starting with: {API_KEY[:5]}...")

genai.configure(api_key=API_KEY)

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models for AI Output Validation ---
class Medicine(BaseModel):
    medicine_name: str
    formulation: Optional[str] = "Unknown"
    strength: Optional[str] = "Unknown"
    frequency: Optional[str] = "Unknown"
    timing: Optional[str] = "Unknown"
    duration: Optional[str] = "Unknown"
    warnings: List[str] = Field(default_factory=list)

class Evaluation(BaseModel):
    completeness: int = Field(ge=0, le=100)
    safety: int = Field(ge=0, le=100)
    ambiguity: str
    overall_rating: str

class PrescriptionAnalysis(BaseModel):
    structured_prescription: List[Medicine]
    score: int = Field(ge=0, le=100)
    evaluation: Evaluation
    summary: str
    recommendations: List[str] = Field(default_factory=list)
    drug_interactions: List[str] = Field(default_factory=list)

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
        logger.info("Sending request to Gemini AI...")
        response = model.generate_content(prompt)
        
        # Check if response is empty
        if not response or not response.text:
            logger.error("AI returned empty response")
            return {"error": "AI returned empty response"}
        
        # Parse the response text as JSON
        json_data = json.loads(response.text)
        
        # --- GUARDRAIL 2: Validate against Pydantic Schema ---
        try:
            validated_data = PrescriptionAnalysis(**json_data)
            logger.info(f"AI Analysis successful. Score: {validated_data.score}")
            return validated_data.model_dump()
        except ValidationError as ve:
            logger.error(f"AI Response Validation Failed: {ve}")
            # Optional: Implement Retry Logic here if critical
            return {
                "error": "AI response failed structure validation", 
                "details": str(ve),
                "raw_response": json_data
            }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON Decode Error: {e}")
        return {
            "error": f"Failed to parse AI response: {str(e)}",
            "raw_response": response.text if response else "No response"
        }
    except Exception as e:
        logger.exception("AI Service Error")
        error_str = str(e)
        if "403" in error_str or "leaked" in error_str.lower():
            return {"error": "403 Your API key was reported as leaked. Please use another API key."}
        return {"error": f"AI service error: {error_str}"}
