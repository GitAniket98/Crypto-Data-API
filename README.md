# 📊 Cryptocurrency Data Backend

## 🚀 Project Overview
This backend application fetches cryptocurrency data from the **CoinGecko API**, stores it in a **MongoDB database**, and provides multiple API endpoints for accessing and analyzing the data.  
It supports **Bitcoin, Ethereum, and Matic** with real-time stats, historical records, and statistical analysis such as **price deviation**.

---

## ✨ Features
- **Automatic Data Fetching**: Fetches the current price, market cap, and 24-hour change for supported coins every **2 minutes** using a cron job.
- **Data Storage**: Stores records in MongoDB with automatic cleanup using TTL (older than 24h removed).
- **API Endpoints**:
  - `/stats` → Latest snapshot of a cryptocurrency
  - `/deviation` → Price deviation (last 100 records)
  - `/coins` → List all supported coins
  - `/history` → Last 100 records for a coin
- **Validation & Error Handling**: Ensures only supported coins are queried.
- **Scalable Structure**: Ready for integration with analytics & trend detection (Python layer).

---

# 📡 API Endpoints – Cryptocurrency Data Backend

---

## 1. `/stats` – Get Latest Data for a Cryptocurrency
**Method**: `GET`  
**Description**: Returns the latest snapshot (price, market cap, 24h change) for a given cryptocurrency.

### Query Parameters
- `coin` (string, required) → one of: `bitcoin`, `ethereum`, `matic-network`

### Sample Request

### **1. `/stats` - Get Latest Data for a Cryptocurrency**

- **Method**: `GET`
- **Query Parameters**:
  - `coin`: (string) One of the supported cryptocurrencies: `bitcoin`, `matic-network`, `ethereum`.
  
- **Sample Request**:
  ```bash
  GET /stats?coin=bitcoin
  ```
  
- **Sample Response**:
  ```json
  {
  "price": 95362,
  "marketCap": 1888354421186.503,
  "24hChange": 3.432
  }

  ```

### **2. `/deviation` - Get Price Deviation for the Last 100 Records**

- **Method**: `GET`
- **Query Parameters**:
  - `coin`: (string) One of the supported cryptocurrencies: `bitcoin`, `matic-network`, `ethereum`.
  
- **Sample Request**:
  ```bash
  GET /deviation?coin=bitcoin
  ```
  
- **Sample Response**:
  ```json
  {
  "coin": "bitcoin",
  "stddev": 294.39,
  "samples": 100
  }

  ```
 ### **3. `/history` - Historical Records**

- **Method**: `GET`
- **Query Parameters**:
  - `coin`: (string) One of the supported cryptocurrencies: `bitcoin`, `matic-network`, `ethereum`.
  - `page`: (int)
  - `limit`: (int) Optional
  
- **Sample Request**:
  ```bash
  GET /history?coin=ethereum&page=1&limit=2
  ```
  
- **Sample Response**:
  ```json
  {
  "coin": "ethereum",
  "page": 1,
  "limit": 2,
  "total": 1500,
  "pages": 750,
  "data": [
    {
      "price": 3100.5,
      "marketCap": 375000000000,
      "24hChange": -0.45,
      "timestamp": "2025-09-27T19:40:00.000Z"
    },
    {
      "price": 3115.2,
      "marketCap": 376000000000,
      "24hChange": 0.30,
      "timestamp": "2025-09-27T19:42:00.000Z"
    }
  ]
  }

  ```

### **4. `/coins` - Supported Coins**

- **Method**: `GET`
  
- **Sample Request**:
  ```bash
  GET /coins
  ```
  
- **Sample Response**:
  ```json
  {
  "coins": ["bitcoin", "ethereum", "matic-network"]
  }

  ```


---

## **Installation and Setup**

### **Prerequisites**

Before setting up the project, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB Atlas** account (for remote database)
- **Git** (for version control)

### **Step 1: Clone the Repository**

Clone the repository to your local machine using Git:

```bash
git clone https://github.com/GitAniket98/Crypto-Data-API.git
cd Crypto-Data-API
```

### **Step 2: Install Dependencies**

Install all the project dependencies using npm:

```bash
npm install
```

### **Step 3: Set Up Environment Variables**

Create a `.env` file in the root directory of the project and add your **MongoDB URI**:

```
MONGO_URI=your_mongo_connection_string
PORT=3000
FETCH_INTERVAL_MINUTES=2
DATA_TTL_SECONDS=2592000
```

You can get your MongoDB connection string from your [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.

### **Step 4: Run the Project**

Run the application locally:

```bash
npm start
```

The application will now be running on `http://localhost:3000`.

---

## **Cron Job to Fetch Data**

This application uses **node-cron** to fetch cryptocurrency data every 2 hours from the **CoinGecko API** and store it in MongoDB. This process is automated through the following cron schedule:

```js
cron.schedule("*/2 * * * *", fetchCryptoData);
```

The cron job fetches data for Bitcoin, Ethereum, and Matic and stores it in the MongoDB database.

---

## **Technologies Used**

- **Node.js**: JavaScript runtime for building the backend server.
- **Express.js**: Web framework for creating the API routes.
- **MongoDB**: NoSQL database to store cryptocurrency data.
- **Mongoose**: MongoDB ODM for schema-based data modeling.
- **Axios**: Promise-based HTTP client to make requests to the CoinGecko API.
- **Node-Cron**: To schedule background jobs to fetch data periodically.
- **CoinGecko API**: Source for cryptocurrency data.

---
