const User = require("../models/User");
const sendEmail = require("../utils/sendEmail"); // Make sure to import the email utility!

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 1. Generate OTP and Expiry (10 minutes from now)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // 2. Create the user with OTP fields
    // (Your User.js pre-save hook will automatically hash the password here!)
    const newUser = await User.create({
      name,
      email,
      password,
      otp,
      otpExpiry,
    });

    // 3. Send the OTP Email
    const message = `Hi ${name},\n\nWelcome to Ceramico! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`;
    
    await sendEmail({
      email: newUser.email,
      subject: "Ceramico - VerifyYour Email",
      message: message,
    });

    // 4. Send success response to the frontend
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
    res.status(500).json({ message: "Server error" });
  }
};

// --- ADD THIS FUNCTION TO HANDLE THE VERIFICATION STEP ---

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Check if OTP is expired
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Verification code has expired. Please register again." });
    }

    // Mark user as verified and clear OTP data
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    
    await user.save();

    res.status(200).json({ message: "Email successfully verified! You can now log in." });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
};