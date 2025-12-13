import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from gemini_service import analyze_prescription_text

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS configuration
origins = [
    "*", # Allow all for development. Restrict in production.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PrescriptionRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Prescription Analysis API is running"}

@app.post("/api/analyze-prescription")
async def analyze_prescription(request: PrescriptionRequest):
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Prescription text is required")
        
        result = analyze_prescription_text(request.text)
        return result
    except Exception as e:
        # In a real app, log the error
        print(f"Error processing prescription: {e}")
        # Return a 500 or appropriate error, passing the message for debugging if needed
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import StreamingResponse
from pdf_service import generate_prescription_pdf

@app.post("/api/generate-pdf")
async def generate_pdf(request: dict):
    # Expecting the full analysis object
    try:
        pdf_buffer = generate_prescription_pdf(request)
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": "attachment; filename=prescription_report.pdf"}
        )
    except Exception as e:
        print(f"PDF Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
