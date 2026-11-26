require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/db");
const authRoutes = require("./src/routes/auth.routes");
const reportRoutes = require("./src/routes/report.routes");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isVercel = process.env.VERCEL === "1";

// Trust Vercel's reverse proxy for accurate rate-limiting IP detection
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

// Use /tmp/uploads on Vercel (read-only filesystem elsewhere) and ./uploads locally
const uploadsDir = isVercel
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later."
    }
  })
);

// Ensure MongoDB is connected on every serverless cold start before hitting routes
let dbConnectionPromise = null;
app.use("/api/", async (req, res, next) => {
  try {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectDB();
    }
    await dbConnectionPromise;
    next();
  } catch (error) {
    dbConnectionPromise = null;
    next(error);
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "EcoConnect API is running.",
    environment: process.env.NODE_ENV || "development"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected server error occurred."
        : err.message
  });
});

// Start HTTP listener only when running locally (not on Vercel serverless)
if (!isVercel) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`EcoConnect API running at http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log("MongoDB connection established.");
      });
    })
    .catch((error) => {
      console.error("Failed to start EcoConnect:", error.message);
      process.exit(1);
    });
}

module.exports = app;