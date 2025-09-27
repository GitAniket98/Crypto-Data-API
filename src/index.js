// src/index.js
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes");
const { connect } = require("./db");
const { startCron } = require("./cronJobs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic health endpoint
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Mount routes
app.use("/", routes);

// Start DB and server
(async () => {
    try {
        connect();

        // Start cron with interval from env or config
        const fetchInterval = process.env.FETCH_INTERVAL_MINUTES ? parseInt(process.env.FETCH_INTERVAL_MINUTES, 10) : undefined;
        startCron(fetchInterval);

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start application:", err);
        process.exit(1);
    }
})();

module.exports = app;
