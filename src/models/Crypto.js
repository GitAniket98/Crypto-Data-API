// src/models/Crypto.js
const mongoose = require("mongoose");
require("dotenv").config();
const config = require("../../config.json");

const Schema = mongoose.Schema;

const cryptoSchema = new Schema({
    coin: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    marketCap: { type: Number },
    change24h: { type: Number },
    timestamp: { type: Date, required: true, index: true }
}, {
    versionKey: false
});

// Compound unique index to prevent duplicate coin+timestamp inserts.
// If two inserts for same timestamp occur, upsert will avoid duplicates, but this also enforces uniqueness.
cryptoSchema.index({ coin: 1, timestamp: 1 }, { unique: true });

// Index to optimize queries by coin + timestamp desc
cryptoSchema.index({ coin: 1, timestamp: -1 });

// TTL index (optional). Controlled via env or config.
const ttlSeconds = parseInt(process.env.DATA_TTL_SECONDS || config.defaultDataTTLSeconds || 0, 10);
if (ttlSeconds > 0) {
    // Create TTL index on 'timestamp' so documents expire after 'ttlSeconds' from their timestamp.
    // Note: TTL is relative to the indexed field value; documents older than `timestamp + ttlSeconds` will be removed.
    cryptoSchema.index({ timestamp: 1 }, { expireAfterSeconds: ttlSeconds });
}

const Crypto = mongoose.model("Crypto", cryptoSchema);

module.exports = Crypto;
