import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3000;

// ✅ Must come BEFORE routes
app.use(cors());
app.use(express.json()); // <-- This line is CRUCIAL

app.post("/send-otp", async (req, res) => {
    console.log("📩 Incoming body:", req.body);

    const { email } = req.body || {};

    if (!email) {
        console.error("❌ Missing email in request body");
        return res.status(400).json({ error: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "amrabso12345@gmail.com", // 🔒 replace with your email
                pass: "pasajuluuiqeuyvy",   // 🔒 use Gmail App Password
            },
        });

        const mailOptions = {
            from: "amrabso12345@gmail.com",
            to: email,
            subject: "رمز التحقق (OTP)",
            text: `رمز التحقق الخاص بك هو: ${otp}`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent to ${email}: ${otp}`);
        res.json({ message: "OTP sent successfully", otp });
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ OTP server running on port ${PORT}`);
});
