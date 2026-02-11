const cron = require("node-cron");
const axios = require("axios");
const Crypto = require("./models/Crypto");
const config = require("../config.json");
require("dotenv").config();

const COINS = (process.env.COINS && process.env.COINS.split(",")) || config.coins || ["bitcoin", "ethereum", "matic-network"];
const COINGECKO_BASE = config.coingecko.baseUrl || "https://api.coingecko.com/api/v3";
const DEFAULT_INTERVAL_MINUTES = parseInt(process.env.FETCH_INTERVAL_MINUTES || config.defaultFetchIntervalMinutes || 2, 10);

/**
 * Fetching all coins in a single api call to avoid rate limiting.
 * 
 */
async function fetchAllCoins() {
    const ids = COINS.join(",");
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&order=market_cap_desc&per_page=${COINS.length}&page=1&sparkline=false`;

    const response = await axios.get(url, { timeout: 15000 });
    return response.data; 
}

async function fetchAndStoreAll() {
    const timestamp = new Date();
    console.log(`[${timestamp.toISOString()}] Fetching data for: ${COINS.join(", ")}`);

    let data;
    try {
        data = await fetchAllCoins();
    } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
            console.error("Rate limited by CoinGecko. Will retry on next scheduled run.");
        } else {
            console.error("Failed to fetch coin data:", err.message);
        }
        return; 
    }

    if (!Array.isArray(data) || data.length === 0) {
        console.warn("No data returned from CoinGecko.");
        return;
    }

    // Save each coin returned from the single batch request
    let saved = 0;
    for (const entry of data) {
        const snapshot = {
            coin: entry.id,
            price: Number(entry.current_price ?? null),
            marketCap: Number(entry.market_cap ?? null),
            change24h: Number(entry.price_change_percentage_24h ?? null),
            timestamp
        };

        // Skip entries with no valid price
        if (!Number.isFinite(snapshot.price)) {
            console.warn(`Skipping ${entry.id} — no valid price`);
            continue;
        }

        try {
            await Crypto.updateOne(
                { coin: snapshot.coin, timestamp: snapshot.timestamp },
                { $setOnInsert: snapshot },
                { upsert: true }
            );
            saved++;
        } catch (dbErr) {
            if (dbErr.code === 11000) {
                // Duplicate key 
            } else {
                console.error(`DB error saving ${entry.id}:`, dbErr.message);
            }
        }
    }

    console.log(`[${new Date().toISOString()}] Saved ${saved}/${data.length} snapshots.`);
}

/**
 * Start cron job 
 */
function startCron(intervalMinutes = DEFAULT_INTERVAL_MINUTES) {
    const mins = Math.max(1, parseInt(intervalMinutes, 10));
    const pattern = `*/${mins} * * * *`;
    console.log(`Cron job started (every ${mins} minutes)`);

    
    fetchAndStoreAll().catch(err => console.error("Initial fetch error:", err));

   
    cron.schedule(pattern, () => {
        fetchAndStoreAll().catch(err => console.error("Scheduled fetch error:", err));
    });
}

module.exports = { startCron, fetchAndStoreAll };