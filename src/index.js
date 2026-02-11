const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { connect } = require("./db");
const routes = require("./routes");
const { startCron } = require("./cronJobs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint 
app.get("/api/", (req, res) => {
    res.json({
        message: "Cryptocurrency Data API",
        version: "1.0.0",
        endpoints: {
            health: "/health",
            coins: "/coins",
            stats: "/stats?coin=bitcoin",
            deviation: "/deviation?coin=bitcoin",
            history: "/history?coin=bitcoin&page=1&limit=10"
        }
    });
});

// API routes
app.use("/api", routes);

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// Start server
async function startServer() {
    try {
        await connect();
        console.log("Database connected");

        const intervalMinutes = parseInt(process.env.FETCH_INTERVAL_MINUTES || 2, 10);
        startCron(intervalMinutes);
        console.log(`Cron job started (every ${intervalMinutes} minutes)`);

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API: http://localhost:${PORT}`);
            console.log(`Health: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

module.exports = app;