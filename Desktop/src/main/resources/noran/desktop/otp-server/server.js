import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";

const app = express();
const PORT = 3500;

// =====================================================
// 🌍 MongoDB Connection
// =====================================================
const uri =
    "mongodb+srv://al-noran:al-noran@cluster0.kap4tle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("Al_noran_System");
        console.log("✅ Connected to MongoDB Atlas");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
    }
}

await connectDB();

// =====================================================
// ⚙️ Middleware
// =====================================================
app.use(cors());
app.use(express.json());

// =====================================================
// 📩 Send OTP — stored in MongoDB
// =====================================================
app.post("/send-otp", async (req, res) => {
    console.log("📩 Incoming body:", req.body);
    const { email } = req.body || {};

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const reversedOtp = otp.split("").reverse().join("");

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
            text: `رمز التحقق الخاص بك هو: ${reversedOtp}`,
        };

        await transporter.sendMail(mailOptions);

        const otps = db.collection("otps");
        await otps.updateOne(
            { email },
            { $set: { otp, reversedOtp, createdAt: new Date() } },
            { upsert: true }
        );

        console.log(`✅ OTP sent to ${email}: ${otp}`);
        res.json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

// =====================================================
// ✅ Verify OTP (checks from MongoDB)
// =====================================================
app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
    }

    try {
        const otps = db.collection("otps");
        const record = await otps.findOne({ email });

        if (
            record &&
            (record.otp === otp || record.reversedOtp === otp)
        ) {
            await otps.deleteOne({ email }); // remove OTP after use
            res.json({ message: "OTP verified successfully" });
        } else {
            res.status(400).json({ error: "Invalid OTP" });
        }
    } catch (error) {
        console.error("❌ Verify OTP error:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
    }
});

// =====================================================
// 🔐 Login API
// =====================================================
app.post("/api/users/login", async (req, res) => {
    console.log("🪪 Incoming login request:", req.body);

    try {
        const { identifier, email, password } = req.body;
        const loginIdentifier = identifier || email;

        if (!loginIdentifier || !password) {
            return res
                .status(400)
                .json({ error: "Email/username and password are required" });
        }

        const users = db.collection("users");

        const user = await users.findOne({
            $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
        });

        if (!user) {
            console.log("❌ User not found for:", loginIdentifier);
            return res.status(404).json({ error: "User not found" });
        }

        console.log("🔐 Entered password:", password);
        console.log("🔐 Stored hash:", user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("🔐 Compare result:", isMatch);

        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        const token = "dummy-jwt-token-" + user._id;

        console.log(`✅ Login success for ${loginIdentifier}`);
        res.json({
            user: {
                username: user.username || user.email,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});


// =====================================================
// 🔑 Update Password
// =====================================================
app.post("/update-password", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const users = db.collection("users");
        const hashed = await bcrypt.hash(password, 10);

        const result = await users.updateOne(
            { email: { $regex: new RegExp(`^${email}$`, "i") } }, // case-insensitive match
            { $set: { password: hashed } }
        );

        console.log("🔍 Update result:", result);

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`✅ Password updated for ${email}`);
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("❌ Error updating password:", error);
        res.status(500).json({ error: "Failed to update password" });
    }
});


// =====================================================
// 👤 Register New User
// =====================================================
app.post("/api/users/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const users = db.collection("users");
        const existing = await users.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const newUser = {
            username: username || email.split("@")[0],
            email,
            password: hashed,
            createdAt: new Date(),
        };

        await users.insertOne(newUser);
        console.log(`✅ User registered: ${email}`);

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// =====================================================
// 🚀 Start Server
// =====================================================
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
