import os
import zipfile
from kaggle.api.kaggle_api_extended import KaggleApi
from dotenv import load_dotenv

def download_medicine_dataset():
    # Load environment variables from .env file
    load_dotenv()
    
    # Set Kaggle credentials from environment variables
    kaggle_username = os.getenv('KAGGLE_USERNAME')
    kaggle_key = os.getenv('KAGGLE_KEY')
    
    if not kaggle_username or not kaggle_key:
        print("Error: KAGGLE_USERNAME and KAGGLE_KEY must be set in .env file")
        print("  KAGGLE_USERNAME=your_username")
        print("  KAGGLE_KEY=your_api_key")
        return
    
    # Set environment variables for Kaggle API
    os.environ['KAGGLE_USERNAME'] = kaggle_username
    os.environ['KAGGLE_KEY'] = kaggle_key
    
    print(f"Authenticating as: {kaggle_username}")
    
    # Authenticate
    api = KaggleApi()
    try:
        api.authenticate()
        print("✓ Authentication successful!")
    except Exception as e:
        print("Error authenticating with Kaggle.")
        print(e)
        return

    # Dataset: shwetbajpai/medicine-dataset (example, found from search results previously)
    # Or 'saurabhshahane/drugs-and-medicines-dataset'
    # Let's try to search for the best match or hardcode one. 
    # The '1mg' one is usually good: 'shwetbajpai/medicine-dataset' (Medicine Data from 1mg.com)
    dataset = 'ujjwalaggarwal402/medicine-dataset'
    
    print(f"Downloading {dataset}...")
    try:
        api.dataset_download_files(dataset, path='.', unzip=True)
        print("Download complete.")
        
        # Rename the main CSV to medicines.csv for simplicity
        # We need to find which file is the CSV.
        for filename in os.listdir('.'):
            if filename.endswith('.csv') and 'medicine' in filename.lower():
                print(f"Found CSV: {filename}")
                if filename != 'medicines.csv':
                    if os.path.exists('medicines.csv'):
                         os.remove('medicines.csv')
                    os.rename(filename, 'medicines.csv')
                    print(f"Renamed {filename} to medicines.csv")
                break
                
    except Exception as e:
        print(f"Error downloading dataset: {e}")

if __name__ == "__main__":
    download_medicine_dataset()
