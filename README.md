# Cryptocurrency Data Backend

A production-ready backend application that fetches cryptocurrency data from **CoinGecko API**, stores it in **MongoDB**, and provides RESTful API endpoints for real-time stats, historical data, and analytics.

## Features

- **Real-time Data Fetching**: Automatic updates every 2 minutes via cron job
- **MongoDB Storage**: Efficient data storage with automatic TTL cleanup
- **8 Cryptocurrencies Supported**: Bitcoin, Ethereum, Matic/POL, Cardano, Solana, Ripple, Dogecoin, Polkadot
- **Statistical Analysis**: Price deviation, moving averages, volatility metrics
- **Compare Feature**: Compare multiple cryptocurrencies side-by-side
- **Input Validation**: Express-validator for robust API security
- **Security**: Helmet.js for HTTP headers, CORS enabled
- **Well-Documented API**: Clear endpoints with error handling

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/GitAniket98/Crypto-Data-API.git
cd Crypto-Data-API

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI

# Start the server
npm start
```

The API will be running at `http://localhost:3000`

## 📡 API Endpoints

### 1. Health Check

**GET** `/health`

Check if the API is running.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-02-09T10:30:00.000Z",
  "uptime": 3600
}
```

### 2. Get Supported Coins

**GET** `/api/coins`

Returns list of all supported cryptocurrencies.

**Response:**

```json
{
  "coins": [
    "bitcoin",
    "ethereum",
    "matic-network",
    "cardano",
    "solana",
    "ripple",
    "dogecoin",
    "polkadot"
  ],
  "count": 8,
  "message": "Supported cryptocurrencies"
}
```

### 3. Get Latest Stats

**GET** `/api/stats?coin=bitcoin`

Get the most recent data for a cryptocurrency.

**Parameters:**

- `coin` (required): One of the supported cryptocurrencies

**Response:**

```json
{
  "coin": "bitcoin",
  "price": 95362.5,
  "marketCap": 1888354421186.5,
  "24hChange": 3.43,
  "timestamp": "2025-02-09T10:30:00.000Z"
}
```

### 4. Get Price Deviation

**GET** `/api/deviation?coin=bitcoin&limit=100`

Calculate standard deviation of price over the last N records.

**Parameters:**

- `coin` (required): Cryptocurrency name
- `limit` (optional, default: 100): Number of records to analyze (2-1000)

**Response:**

```json
{
  "coin": "bitcoin",
  "deviation": 294.39,
  "mean": 95000.25,
  "samples": 100,
  "timeRange": {
    "from": "2025-02-09T07:00:00.000Z",
    "to": "2025-02-09T10:30:00.000Z"
  }
}
```

### 5. Get Historical Data

**GET** `/api/history?coin=ethereum&page=1&limit=50`

Retrieve historical records with pagination.

**Parameters:**

- `coin` (required): Cryptocurrency name
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 100, max: 1000): Records per page

**Response:**

```json
{
  "coin": "ethereum",
  "page": 1,
  "limit": 50,
  "total": 1500,
  "totalPages": 30,
  "hasNextPage": true,
  "hasPrevPage": false,
  "data": [
    {
      "price": 3100.5,
      "marketCap": 375000000000,
      "24hChange": -0.45,
      "timestamp": "2025-02-09T10:30:00.000Z"
    }
  ]
}
```

### 6. Compare Cryptocurrencies (NEW)

**GET** `/api/compare?coins=bitcoin,ethereum,solana`

Compare multiple cryptocurrencies side-by-side.

**Parameters:**

- `coins` (required): Comma-separated list of coin names

**Response:**

```json
{
  "comparison": [
    {
      "coin": "bitcoin",
      "price": 95362.5,
      "marketCap": 1888354421186.5,
      "24hChange": 3.43,
      "timestamp": "2025-02-09T10:30:00.000Z"
    },
    {
      "coin": "ethereum",
      "price": 3100.5,
      "marketCap": 375000000000,
      "24hChange": -0.45,
      "timestamp": "2025-02-09T10:30:00.000Z"
    }
  ],
  "count": 2,
  "timestamp": "2025-02-09T10:30:00.000Z"
}
```

## Configuration

Edit `config.json` to customize:

```json
{
  "coins": ["bitcoin", "ethereum", ...],
  "defaultFetchIntervalMinutes": 2,
  "defaultDataTTLSeconds": 2592000
}
```

## Analytics Layer (Python)

Advanced analytics scripts for trend analysis and visualization.

```bash
cd analytics
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run analysis
python analysis.py
python correlation.py
```

**Features:**

- Simple Moving Averages (SMA)
- Volatility analysis
- Correlation heatmaps
- Rolling correlations
- PNG visualizations in `analytics/outputs/`

## Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Input Validation** - Express-validator
- **Error Handling** - Comprehensive error responses
- **MongoDB Injection Protection** - Mongoose schema validation

## Project Structure

```
Crypto-Data-API/
├── src/
│   ├── models/
│   │   └── Crypto.js          # MongoDB schema
│   ├── cronJobs.js             # Data fetching cron job
│   ├── db.js                   # Database connection
│   ├── index.js                # Express server
│   └── routes.js               # API routes
├── analytics/
│   ├── analysis.py             # SMA & volatility
│   ├── correlation.py          # Correlation analysis
│   └── requirements.txt        # Python dependencies
├── config.json                 # App configuration
├── package.json                # Node dependencies
└── README.md                   # Documentation
```

## Testing the API(Locally)

```bash
# Health check
curl http://localhost:3000/api/health

# Get all supported coins
curl http://localhost:3000/api/coins

# Get Bitcoin stats
curl http://localhost:3000/api/stats?coin=bitcoin

# Get price deviation
curl http://localhost:3000/api/deviation?coin=ethereum

# Get historical data
curl http://localhost:3000/api/history?coin=solana&page=1&limit=10

# Compare multiple coins
curl http://localhost:3000/api/compare?coins=bitcoin,ethereum,cardano
```

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] User authentication and API keys
- [ ] Rate limiting per user
- [ ] Price alerts via email/SMS
- [ ] More cryptocurrencies
- [ ] Advanced charting endpoints
- [ ] Machine learning price predictions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning and portfolio purposes.

## Author

**Aniket**

- GitHub: [@GitAniket98](https://github.com/GitAniket98)

## Acknowledgments

- [CoinGecko API](https://www.coingecko.com/api) for cryptocurrency data
- [MongoDB](https://www.mongodb.com/) for database
- [Express.js](https://expressjs.com/) for web framework
