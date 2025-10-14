import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

const app = express();
const PORT = 3000;

// Store OTPs temporarily (in-memory, use Redis or DB in production)
const otpStore = new Map();

app.use(cors());
app.use(express.json());

app.post("/send-otp", async (req, res) => {
    console.log("📩 Incoming body:", req.body);

    const { email } = req.body || {};

    if (!email) {
        console.error("❌ Missing email in request body");
        return res.status(400).json({ error: "Email is required" });
    }

    // Generate exactly 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString().padStart(5, '0');
    const reversedOtp = otp.split('').reverse().join(''); // Reverse OTP for Arabic RTL

    // Store both original and reversed OTP
    otpStore.set(email, { original: otp, reversed: reversedOtp });

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "noransmartai@gmail.com",
                pass: "pmermdujttgyzdgq",
            },
        });

        const mailOptions = {
            from: "noransmartai@gmail.com",
            to: email,
            subject: "رمز التحقق (OTP)",
            text: `رمز التحقق الخاص بك هو: ${reversedOtp}`, // Send reversed OTP
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent to ${email}: ${reversedOtp} (original: ${otp})`);
        res.json({ message: "OTP sent successfully", otp: reversedOtp });
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
    }

    const storedOtp = otpStore.get(email);
    if (storedOtp && (storedOtp.original === otp || storedOtp.reversed === otp)) {
        otpStore.delete(email); // Clear OTP after verification
        res.json({ message: "OTP verified successfully" });
    } else {
        res.status(400).json({ error: "Invalid OTP" });
    }
});

app.post("/update-password", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        // In a real application, you'd update the password in your database
        // Here, we assume the password is already hashed by the Java client
        console.log(`✅ Password updated for ${email}`);
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("❌ Error updating password:", error);
        res.status(500).json({ error: "Failed to update password" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ OTP server running on port ${PORT}`);
});