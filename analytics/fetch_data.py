import os
from pymongo import MongoClient
import pandas as pd
from dotenv import load_dotenv

# Load environment variables from .env (same as Node backend)
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "test"
COLLECTION = "cryptos"

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION]

def fetch_latest_records(coin: str, limit: int = 100):
    """Fetch last N records for a given coin from MongoDB."""
    cursor = (
        collection.find({"coin": coin})
        .sort("timestamp", -1)   # latest first
        .limit(limit)
    )
    data = list(cursor)
    if not data:
        print(f"⚠️ No data found for {coin}")
        return None
    # Convert to DataFrame
    df = pd.DataFrame(data)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp")
    return df

if __name__ == "__main__":
    coin = "bitcoin"
    df = fetch_latest_records(coin)
    if df is not None:
        print(f"\n✅ Fetched {len(df)} records for {coin}")
        print(df.head())
