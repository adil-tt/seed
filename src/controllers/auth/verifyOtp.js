const User = require("../../models/User");

/**
 * Verify OTP for registration
 */
const verifyOtp = async (req, res, next) => {
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

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Verification code has expired. Please register again." });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Email successfully verified! You can now log in." });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    next(error);
  }
};

module.exports = verifyOtp;
