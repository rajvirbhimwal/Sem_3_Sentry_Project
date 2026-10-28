require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/db");
const authRoutes = require("./src/routes/auth.routes");
const reportRoutes = require("./src/routes/report.routes");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
  })
);

app.use(express.json({ limit: "1mb" }));

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

async function startServer() {
  try {
    await connectDB();


    app.listen(PORT, () => {
      console.log(`EcoConnect API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log("MongoDB connection established.");
    });


  } catch (error) {
    console.error("Failed to start EcoConnect:", error.message);
    process.exit(1);
  }
}

startServer();
