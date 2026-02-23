const express = require("express");
const cors = require("cors");

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Health Check Route (Great for testing if the server is alive)
app.get("/", (req, res) => {
  res.status(200).json({ message: "Ceramico API is running successfully!" });
});

// 3. Routes
app.use("/api/auth", require("./routes/auth.routes"));

// 4. Global Error Handling Middleware (Catches unhandled errors)
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({ message: "Something went wrong on the server!" });
});

module.exports = app;