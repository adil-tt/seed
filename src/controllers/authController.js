const User = require("../models/User");
const sendEmail = require("../utils/sendEmail"); 
const jwt = require("jsonwebtoken"); // <-- ADDED FOR LOGIN
const bcrypt = require("bcryptjs");  // <-- ADDED FOR LOGIN

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
      subject: "Ceramico - Verify Your Email",
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

// --- VERIFICATION FUNCTION ---

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

// --- ADD THIS FUNCTION FOR LOGIN ---

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if fields are empty
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 2. Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3. Check if they have verified their email
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    // 4. Compare the typed password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 5. Generate a JWT Token (Requires JWT_SECRET in your .env file)
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // 6. Send success response back to the frontend
    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
// --- FORGOT PASSWORD (SEND OTP) ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    // 1. Generate a new OTP and Expiry
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 2. Save the OTP to the user's database record
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // 3. Send the Reset Email
    const message = `Hi ${user.name},\n\nYou requested a password reset. Your OTP is: ${otp}\n\nIf you did not request this, please ignore this email.`;
    
    await sendEmail({
      email: user.email,
      subject: "Ceramico - Password Reset OTP",
      message: message,
    });

    res.status(200).json({ message: "Password reset OTP sent to your email." });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// --- RESET PASSWORD (VERIFY OTP & UPDATE PASSWORD) ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Verify the OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 2. Check if OTP is expired
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // 3. Update the password
    // (Because of the pre-save hook in your User.js model, this will automatically be hashed!)
    user.password = newPassword;
    
    // 4. Clear the OTP fields so they can't be used again
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully! You can now log in." });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};