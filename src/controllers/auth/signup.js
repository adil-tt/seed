const User = require("../../models/User");
const sendEmail = require("../../utils/sendEmail");

/**
 * Register a new user and send OTP
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await User.create({
      name,
      email,
      password,
      otp,
      otpExpiry,
    });

    const message = `Hi ${name},\n\nWelcome to Ceramico! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`;

    await sendEmail({
      email: newUser.email,
      subject: "Ceramico - Verify Your Email",
      message: message,
    });

    res.status(201).json({
      message: "User registered successfully. OTP sent to email.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    next(error);
  }
};

module.exports = signup;
