const express = require("express");
const { query, validationResult } = require("express-validator");
const Crypto = require("./models/Crypto");
const config = require("../config.json");

const router = express.Router();

// Helper middleware 
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: "Validation failed", 
            details: errors.array() 
        });
    }
    next();
}

/**
 * GET /coins
 * Returns the configured coins with metadata
 */
router.get("/coins", (req, res) => {
    const coins = config.coins || [];
    res.json({ 
        coins,
        count: coins.length,
        message: "Supported cryptocurrencies"
    });
});

/**
 * GET /stats?coin=bitcoin
 * Returns the latest snapshot for a coin
 */
router.get(
    "/stats",
    [query("coin").isString().notEmpty().trim()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { coin } = req.query;
            
            // Validate coin is supported
            if (!config.coins.includes(coin)) {
                return res.status(400).json({ 
                    error: "Unsupported coin",
                    supported: config.coins
                });
            }

            const latest = await Crypto.findOne({ coin })
                .sort({ timestamp: -1 })
                .lean()
                .exec();

            if (!latest) {
                return res.status(404).json({ 
                    error: `No data available for ${coin}` 
                });
            }

            // Return clean response
            res.json({
                coin: latest.coin,
                price: latest.price,
                marketCap: latest.marketCap,
                "24hChange": latest.change24h,
                timestamp: latest.timestamp
            });
        } catch (err) {
            console.error("Error in /stats:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * GET /deviation?coin=bitcoin&limit=100
 * Returns standard deviation of price over last N records
 */
router.get(
    "/deviation",
    [
        query("coin").isString().notEmpty().trim(),
        query("limit").optional().isInt({ min: 2, max: 1000 }).toInt()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { coin } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;

            // Validate coin is supported
            if (!config.coins.includes(coin)) {
                return res.status(400).json({ 
                    error: "Unsupported coin",
                    supported: config.coins
                });
            }

            const docs = await Crypto.find({ coin })
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean()
                .exec();

            if (!docs || docs.length < 2) {
                return res.status(404).json({ 
                    error: "Not enough data for calculation",
                    minimum: 2,
                    found: docs?.length || 0
                });
            }

            const prices = docs.map(d => Number(d.price)).filter(p => Number.isFinite(p));
            
            // Calculate statistics
            const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
            const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (prices.length - 1);
            const stddev = Math.sqrt(variance);

            res.json({ 
                coin, 
                deviation: parseFloat(stddev.toFixed(2)),
                mean: parseFloat(mean.toFixed(2)),
                samples: prices.length,
                timeRange: {
                    from: docs[docs.length - 1].timestamp,
                    to: docs[0].timestamp
                }
            });
        } catch (err) {
            console.error("Error in /deviation:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * GET /history?coin=bitcoin&page=1&limit=50
 * Returns historical snapshots for a coin with pagination
 */
router.get(
    "/history",
    [
        query("coin").isString().notEmpty().trim(),
        query("page").optional().isInt({ min: 1 }).toInt(),
        query("limit").optional().isInt({ min: 1, max: 1000 }).toInt()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { coin } = req.query;
            const page = parseInt(req.query.page || 1, 10);
            const limit = parseInt(req.query.limit || 100, 10);
            const skip = (page - 1) * limit;

            // Validate coin is supported
            if (!config.coins.includes(coin)) {
                return res.status(400).json({ 
                    error: "Unsupported coin",
                    supported: config.coins
                });
            }

            const [total, docs] = await Promise.all([
                Crypto.countDocuments({ coin }),
                Crypto.find({ coin })
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean()
                    .exec()
            ]);

            if (docs.length === 0) {
                return res.status(404).json({ 
                    error: `No historical data for ${coin}` 
                });
            }

            res.json({
                coin,
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
                data: docs.map(d => ({
                    price: d.price,
                    marketCap: d.marketCap,
                    "24hChange": d.change24h,
                    timestamp: d.timestamp
                }))
            });
        } catch (err) {
            console.error("Error in /history:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * NEW: GET /compare?coins=bitcoin,ethereum
 * Compare multiple cryptocurrencies side-by-side
 */
router.get(
    "/compare",
    [query("coins").isString().notEmpty()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const coinsParam = req.query.coins;
            const requestedCoins = coinsParam.split(',').map(c => c.trim());

            // Validate all coins are supported
            const unsupported = requestedCoins.filter(c => !config.coins.includes(c));
            if (unsupported.length > 0) {
                return res.status(400).json({ 
                    error: "Unsupported coins",
                    unsupported,
                    supported: config.coins
                });
            }

            // Fetch latest data for all requested coins
            const results = await Promise.all(
                requestedCoins.map(coin => 
                    Crypto.findOne({ coin })
                        .sort({ timestamp: -1 })
                        .lean()
                        .exec()
                )
            );

            const comparison = results.map((data, index) => {
                if (!data) return null;
                return {
                    coin: requestedCoins[index],
                    price: data.price,
                    marketCap: data.marketCap,
                    "24hChange": data.change24h,
                    timestamp: data.timestamp
                };
            }).filter(Boolean);

            if (comparison.length === 0) {
                return res.status(404).json({ 
                    error: "No data available for requested coins" 
                });
            }

            res.json({
                comparison,
                count: comparison.length,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error in /compare:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

module.exports = router;