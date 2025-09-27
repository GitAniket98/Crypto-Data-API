// src/cronJobs.js
const cron = require("node-cron");
const fetch = require("node-fetch");
const Crypto = require("./models/Crypto");
const config = require("../config.json");
require("dotenv").config();

const COINS = (process.env.COINS && process.env.COINS.split(",")) || config.coins || ["bitcoin", "ethereum", "matic-network"];
const COINGECKO_BASE = config.coingecko.baseUrl || "https://api.coingecko.com/api/v3";

const DEFAULT_INTERVAL_MINUTES = parseInt(process.env.FETCH_INTERVAL_MINUTES || config.defaultFetchIntervalMinutes || 2, 10);

/**
 * Fetch helper with retry logic.
 * @param {string} url
 * @param {number} retries
 * @param {number} delayMs
 */
async function fetchWithRetry(url, retries = 3, delayMs = 2000) {
    let lastErr;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, { timeout: 10000 });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
            }
            const data = await res.json();
            return data;
        } catch (err) {
            lastErr = err;
            console.error(`Fetch attempt ${attempt}/${retries} failed for ${url}: ${err.message}`);
            if (attempt < retries) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
    throw lastErr;
}

/**
 * Fetch & store snapshots for the configured coins.
 */
async function fetchAndStoreAll() {
    console.log(`[${new Date().toISOString()}] Starting fetch for coins: ${COINS.join(", ")}`);
    for (const coin of COINS) {
        try {
            // Use CoinGecko's /simple/price endpoint for a light-weight fetch
            const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coin)}&order=market_cap_desc&per_page=1&page=1&sparkline=false`;
            const data = await fetchWithRetry(url, 3, 1500);
            if (!Array.isArray(data) || data.length === 0) {
                console.warn(`No data returned for coin ${coin}`);
                continue;
            }

            const entry = data[0];
            const snapshot = {
                coin: coin,
                price: Number(entry.current_price ?? entry.price ?? null),
                marketCap: Number(entry.market_cap ?? null),
                change24h: Number(entry.price_change_percentage_24h ?? entry.change24h ?? null),
                timestamp: new Date()
            };

            // Use upsert to avoid duplicates (unique index on coin+timestamp)
            // We insert with timestamp rounded/truncated to minute to reduce collision sensitivity (optional).
            // Here we keep full Date, but using unique index prevents duplicates for the same exact timestamp.
            try {
                await Crypto.updateOne(
                    { coin: snapshot.coin, timestamp: snapshot.timestamp }, // match exact timestamp
                    { $setOnInsert: snapshot },
                    { upsert: true }
                );
                console.log(`Saved snapshot for ${coin} @ ${snapshot.timestamp.toISOString()}`);
            } catch (dbErr) {
                // If unique index violation occurs because of near-simultaneous inserts with slightly different timestamps,
                // this catches duplicate key errors and avoids crashing the job.
                if (dbErr && dbErr.code === 11000) {
                    console.warn(`Duplicate snapshot detected for ${coin} at ${snapshot.timestamp.toISOString()}`);
                } else {
                    console.error(`DB error while saving ${coin}:`, dbErr);
                }
            }
        } catch (err) {
            console.error(`Failed to fetch/store for coin ${coin}:`, err.message || err);
        }
    }
    console.log(`[${new Date().toISOString()}] Fetch cycle complete`);
}

/**
 * Start cron job with given interval in minutes.
 * Interval default is 2 minutes if not provided.
 */
function startCron(intervalMinutes = DEFAULT_INTERVAL_MINUTES) {
    // cron pattern for every N minutes: '*/N * * * *'
    const pattern = `*/${Math.max(1, parseInt(intervalMinutes, 10))} * * * *`;
    console.log(`Scheduling data fetch every ${intervalMinutes} minute(s) with pattern '${pattern}'`);

    // Run immediately once on startup, then schedule
    (async () => {
        try {
            await fetchAndStoreAll();
        } catch (err) {
            console.error("Initial fetch error:", err);
        }
    })();

    cron.schedule(pattern, async () => {
        try {
            await fetchAndStoreAll();
        } catch (err) {
            console.error("Scheduled fetch error:", err);
        }
    });
}

module.exports = {
    startCron,
    fetchAndStoreAll,
};
