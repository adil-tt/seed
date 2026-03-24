const User = require("../../models/User");
const sendEmail = require("../../utils/sendEmail");

/**
 * Request password reset (sends OTP)
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const message = `Hi ${user.name},\n\nYou requested a password reset. Your OTP is: ${otp}\n\nIf you did not request this, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: "Ceramico - Password Reset OTP",
      message: message,
    });

    res.status(200).json({ message: "Password reset OTP sent to your email." });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    next(error);
  }
};

module.exports = forgotPassword;
