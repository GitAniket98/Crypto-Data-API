// src/routes.js
const express = require("express");
const { query, validationResult } = require("express-validator");
const Crypto = require("./models/Crypto");
const config = require("../config.json");

const router = express.Router();

// Helper middleware to check validations
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

/**
 * GET /coins
 * Returns the configured coins.
 */
router.get("/coins", (req, res) => {
    const coinsFromConfig = (process.env.COINS && process.env.COINS.split(",")) || config.coins || [];
    res.json({ coins: coinsFromConfig });
});

/**
 * GET /stats?coin=bitcoin
 * Returns the latest snapshot for a coin.
 */
router.get(
    "/stats",
    [query("coin").isString().notEmpty().trim()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { coin } = req.query;
            const latest = await Crypto.findOne({ coin }).sort({ timestamp: -1 }).lean().exec();
            if (!latest) return res.status(404).json({ error: "No data for coin" });
            res.json(latest);
        } catch (err) {
            console.error("Error in /stats:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * GET /deviation?coin=bitcoin&limit=100
 * Returns standard deviation of price over last N records (default 100)
 */
router.get(
    "/deviation",
    [
        query("coin").isString().notEmpty().trim(),
        query("limit").optional().isInt({ min: 2, max: 10000 }).toInt()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { coin } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;

            const docs = await Crypto.find({ coin }).sort({ timestamp: -1 }).limit(limit).lean().exec();
            if (!docs || docs.length === 0) return res.status(404).json({ error: "Not enough data" });

            const prices = docs.map((d) => Number(d.price)).filter((p) => Number.isFinite(p));
            if (prices.length < 2) return res.status(400).json({ error: "Not enough price data" });

            // Calculate sample standard deviation
            const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
            const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (prices.length - 1);
            const stddev = Math.sqrt(variance);

            res.json({ coin, stddev, samples: prices.length });
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
            const coin = req.query.coin;
            const page = parseInt(req.query.page || 1, 10);
            const limit = parseInt(req.query.limit || 100, 10);
            const skip = (page - 1) * limit;

            const [total, docs] = await Promise.all([
                Crypto.countDocuments({ coin }),
                Crypto.find({ coin }).sort({ timestamp: -1 }).skip(skip).limit(limit).lean().exec()
            ]);

            res.json({
                coin,
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                data: docs
            });
        } catch (err) {
            console.error("Error in /history:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

module.exports = router;
