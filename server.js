require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log("http://localhost:5000");
  });
}).catch(err => {
  console.error("Failed to connect to DB", err);
  process.exit(1);
});