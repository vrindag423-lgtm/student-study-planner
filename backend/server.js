require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const app = express();
// Connect to MongoDB
connectDB();
// Middleware
app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://idyllic-syrniki-7232aa.netlify.app"
    ],
    credentials: true
}));
app.use(express.json());
// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Study Planner API is running" });
});

// Serve frontend (static files) - allows single-service deployment
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// Fallback to index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// 404 handler for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});