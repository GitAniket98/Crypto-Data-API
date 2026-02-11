import os
from pymongo import MongoClient
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "crypto"
COLLECTION = "cryptos"

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION]

def fetch_latest_records(coin: str, limit: int = 100):
    """Fetch last N records for a given coin from MongoDB."""
    cursor = (
        collection.find(
            {"coin": coin}, 
            {"_id": 0, "coin": 1, "price": 1, "timestamp": 1}
        )
        .sort("timestamp", -1)  
        .limit(limit)
    )
    
    data = list(cursor)
    if not data:
        print(f"No data found for {coin}")
        return None
        
    df = pd.DataFrame(data)
    
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    return df

if __name__ == "__main__":
   
    coin = "bitcoin"
    df = fetch_latest_records(coin)
    if df is not None:
        print(f"\nSuccessfully fetched {len(df)} records for {coin}")
        print(df.head())