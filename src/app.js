const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Ceramico API is running successfully!" });
});

// 3. Routes
const apiRoutes = require("./routes/api.routes");
app.use("/api", apiRoutes);

// 4. Static Files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.static(path.join(__dirname, "../public")));

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
  });
});

module.exports = app;