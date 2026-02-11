// src/db.js
const mongoose = require("mongoose");
const config = require("../config.json");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGO_DB_NAME || config.mongo.dbName || "crypto";

async function connect() {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });

    mongoose.connection.on("connected", () => {
        console.log("MongoDB connected");
    });

    mongoose.connection.on("error", (err) => {
        console.error("MongoDB error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected");
    });

    process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
        process.exit(0);
    });
}

module.exports = { connect, mongoose };