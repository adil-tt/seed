// const User = require("../models/User");

// // ================= SIGNUP =================
// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, password, confirmPassword } = req.body;

//     // Check passwords match
//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     // Check if user exists
//     const userExists = await User.findOne({ email });

//     if (userExists) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Generate OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     const user = await User.create({
//       name,
//       email,
//       password,
//       otp,
//       otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
//     });

//     res.status(201).json({
//       message: "User registered successfully. Please verify OTP.",
//       email: user.email,
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, invalid token" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };