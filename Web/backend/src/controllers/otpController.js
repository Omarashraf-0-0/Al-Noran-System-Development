const User = require("../models/user");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// ========== إرسال OTP ==========
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 دقايق
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ msg: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========== التحقق من OTP ==========
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.resetOTP !== otp)
      return res.status(400).json({ msg: "Invalid OTP" });

    if (Date.now() > user.otpExpires)
      return res.status(400).json({ msg: "OTP expired" });

    res.json({ msg: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========== تغيير الباسورد ==========
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Don't manually hash - let the pre('save') hook handle it
    user.password = newPassword; // Assign plain text password
    user.resetOTP = undefined;
    user.otpExpires = undefined;

    await user.save(); // pre('save') hook will hash the password

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { forgotPassword, verifyOTP, resetPassword };
