import os
import zipfile
from kaggle.api.kaggle_api_extended import KaggleApi

def download_medicine_dataset():
    # Authenticate
    api = KaggleApi()
    try:
        api.authenticate()
    except Exception as e:
        print("Error authenticating with Kaggle. Make sure kaggle.json is in ~/.kaggle/ or the current directory.")
        print(e)
        return

    # Dataset: shwetbajpai/medicine-dataset (example, found from search results previously)
    # Or 'saurabhshahane/drugs-and-medicines-dataset'
    # Let's try to search for the best match or hardcode one. 
    # The '1mg' one is usually good: 'shwetbajpai/medicine-dataset' (Medicine Data from 1mg.com)
    dataset = 'shwetbajpai/medicine-dataset'
    
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
