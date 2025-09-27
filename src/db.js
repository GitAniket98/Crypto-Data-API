// src/db.js
const mongoose = require("mongoose");
const config = require("../config.json");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = (process.env.MONGO_DB_NAME) || config.mongo.dbName || "crypto";

const fullUri = `${MONGO_URI}/${DB_NAME}`;

function connect() {
    mongoose.set("strictQuery", false);

    mongoose.connect(fullUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    mongoose.connection.on("connected", () => {
        console.log(`MongoDB connected to ${fullUri}`);
    });

    mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected");
    });

    // optional graceful shutdown
    process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed due to app termination");
        process.exit(0);
    });

    return mongoose;
}

module.exports = {
    connect,
    mongoose
};
