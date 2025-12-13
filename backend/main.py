import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from gemini_service import analyze_prescription_text
import pandas as pd
import math

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class PrescriptionRequest(BaseModel):
    text: str

# --- Medicine Data Loading ---
MEDICINE_DB = None

def load_medicine_data():
    global MEDICINE_DB
    csv_path = "medicines.csv"
    
    # Auto-download if not present
    if not os.path.exists(csv_path):
        print("medicines.csv not found. Attempting to download from Kaggle...")
        try:
            from download_data import download_medicine_dataset
            download_medicine_dataset()
        except Exception as e:
            print(f"Failed to auto-download dataset: {e}")
            print("Real-time search will be disabled.")
            return
    
    if os.path.exists(csv_path):
        try:
            print("Loading medicine dataset...")
            # Load only necessary columns to save memory if dataset is huge
            # Adjust column names based on actual CSV. Assuming common ones or inspecting later.
            # For now, load everything but treat it carefully.
            df = pd.read_csv(csv_path)
            
            # Normalize column names
            df.columns = [c.lower().strip() for c in df.columns]
            
            # Identify the 'name' column
            potential_names = ['name', 'drug_name', 'medicine_name', 'brand_name']
            name_col = next((col for col in potential_names if col in df.columns), None)
            
            if name_col:
                # Rename to 'name' for consistency
                df = df.rename(columns={name_col: 'name'})
                # specific to 1mg dataset often used
                if 'salt_composition' in df.columns:
                     df = df.rename(columns={'salt_composition': 'composition'})
                
                # Keep reasonably small
                keep_cols = ['name', 'composition', 'manufacturer', 'price', 'short_composition1', 'short_composition2']
                actual_cols = [c for c in keep_cols if c in df.columns]
                # Always ensure name is there
                if 'name' not in actual_cols: actual_cols.append('name')
                
                MEDICINE_DB = df[actual_cols].dropna(subset=['name'])
                # Convert name to string just in case
                MEDICINE_DB['name'] = MEDICINE_DB['name'].astype(str)
                print(f"Loaded {len(MEDICINE_DB)} medicines.")
            else:
                print("Could not find a 'name' column in medicines.csv")
        except Exception as e:
            print(f"Error loading medicines.csv: {e}")
    else:
        print("medicines.csv still not found after download attempt. Real-time search will be disabled.")

# Load on startup
load_medicine_data()

@app.get("/api/medicines/search")
def search_medicines(q: str):
    if MEDICINE_DB is None:
        return []
    
    if not q or len(q) < 2:
        return []
    
    # Case insensitive search
    # We can use str.contains
    # Limit to top 20 results for performance
    
    try:
        # Simple contains search
        mask = MEDICINE_DB['name'].str.contains(q, case=False, na=False)
        results = MEDICINE_DB[mask].head(20)
        
        # Format response
        response = []
        for _, row in results.iterrows():
            item = {"name": row['name']}
            if 'composition' in row:
                item['composition'] = row['composition'] if isinstance(row['composition'], str) else ""
            if 'manufacturer' in row:
                 item['manufacturer'] = row['manufacturer'] if isinstance(row['manufacturer'], str) else ""
            response.append(item)
            
        return response
    except Exception as e:
        print(f"Search error: {e}")
        return []

@app.get("/")
def read_root():
    return {"message": "Prescription Analysis API is running"}

@app.post("/api/analyze-prescription")
async def analyze_prescription(request: PrescriptionRequest):
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Prescription text is required")
        
        result = analyze_prescription_text(request.text)
        print(result)
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
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
