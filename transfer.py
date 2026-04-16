import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("servis-hesabi.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

excel_dosya_adi = "NStm10Data.xlsx" 
df = pd.read_excel(excel_dosya_adi)

collection_name = "Products" 

print("The transfer is starting...")

for index, row in df.iterrows():

    veri = row.dropna().to_dict()
    
    db.collection(collection_name).add(veri)
    
    if (index + 1) % 10 == 0:
        print(f" {index + 1} rows are sent...")

print("\n The transaction was completed successfully.")