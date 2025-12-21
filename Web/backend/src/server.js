const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const app = express();
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const { logger, logEvents } = require("./middleware/logger");
const os = require("os");

// Function to get local network IP address
function getLocalIP() {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			// Skip internal (loopback) and non-IPv4 addresses
			if (iface.family === "IPv4" && !iface.internal) {
				return iface.address;
			}
		}
	}
	return "localhost";
}

// --- 1. استيراد المكتبات الجديدة ---
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);

connectDB();

// --- 2. إنشاء سيرفر HTTP وربطه بـ Express و Socket.IO ---
const server = http.createServer(app);

// CORS allowed origins - supports both development and production
const allowedOrigins = [
	"http://localhost:5173",
	"http://localhost:3000",
	"https://al-noran-system.web.app",       // Firebase Hosting
	"https://al-noran-system.firebaseapp.com", // Firebase Hosting alternate
	"https://alnoran.org",                    // Custom domain
	"https://www.alnoran.org",                // Custom domain with www
	process.env.FRONTEND_URL,                 // Environment variable for flexibility
].filter(Boolean); // Remove undefined values

const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
		credentials: true,
	},
});

app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (mobile apps, Postman, etc.)
			if (!origin) return callback(null, true);
			
			if (allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				console.log(`CORS blocked origin: ${origin}`);
				callback(null, true); // Allow all origins in production for now
			}
		},
		credentials: true,
		optionsSuccessStatus: 200,
	})
);
app.use(logger);

// app.use(cors(corsOptions))

app.use(express.json());

app.use(cookieParser());

// --- 3. إضافة middleware لجعل io متاحاً في كل routes ---
// هذا سيمكنك من الوصول إليه داخل الـ controllers
app.use((req, res, next) => {
	req.io = io;
	next();
});

// Only serve frontend static files in development (when frontend folder exists)
const frontendPath = path.join(__dirname, "..", "..", "frontend", "public");
const fs = require('fs');
if (fs.existsSync(frontendPath)) {
	app.use("/", express.static(frontendPath));
}

// Serve uploaded files (both legacy local uploads and new local uploads)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/", require("./routes/root"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/users", require("./routes/loginRoutes"));
app.use("/api/otp", require("./routes/otpRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use("/api/acid", require("./routes/acidRoutes"));
app.use("/api/invoice", require("./routes/invoiceRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));
app.use("/api/upload/users", require("./routes/uploadRoutes"));
app.use("/api/upload/shipments", require("./routes/uploadRoutes"));
app.use("/api/uploads", require("./routes/uploadS3Routes")); // S3 Upload Routes
app.use("/api/chat", require("./routes/chatRoutes")); // Chat Routes
app.use("/api/payments", require("./routes/paymentRoutes")); // Payment Routes

// =====================================================
// EXPORT SYSTEM ROUTES (NEW)
// =====================================================
app.use("/api/ucr", require("./routes/ucrRoutes")); // UCR (Export License) Routes
app.use("/api/export-shipments", require("./routes/exportShipmentRoutes")); // Export Shipment Routes
app.use("/api/vessel", require("./routes/vesselRoutes")); // Vessel Tracking Routes

// =====================================================
// NOTIFICATIONS ROUTES
// =====================================================
app.use("/api/notifications", require("./routes/notificationRoutes")); // Notifications Routes

app.use((req, res) => {
	res.status(404);
	if (req.accepts("html")) {
		// res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'views',  '404.html'))
		res.json({ message: "404 Not Found" });
	} else if (req.accepts("json")) {
		res.json({ message: "404 Not Found" });
	} else {
		res.type("txt").send("404 Not Found");
	}
});

app.use(errorHandler);

// --- 4. منطق الـ Socket.IO ---
// Import Chat models for socket handlers
const { Chat, Message } = require("./models/chat");

// Track online users
const onlineUsers = new Map(); // Map<socketId, { odI, userType }>
const userSockets = new Map(); // Map<odI, Set<socketId>>

io.on("connection", (socket) => {
	console.log(`User connected: ${socket.id}`);

	// Shipment room handling
	socket.on("joinShipmentRoom", (acid) => {
		socket.join(acid);
		console.log(`Socket ${socket.id} joined room for ACID: ${acid}`);
	});

	// --- Chat Socket Handlers ---

	// User identifies themselves (supports both "identify" and "authenticate" events)
	socket.on("identify", ({ odI, userType }) => {
		console.log(`User identified: ${odI} (${userType})`);
		onlineUsers.set(socket.id, { odI, userType });

		// Track socket for this user
		if (!userSockets.has(odI)) {
			userSockets.set(odI, new Set());
		}
		userSockets.get(odI).add(socket.id);

		// Broadcast online status to relevant users
		socket.broadcast.emit("user_online", { odI, userType });
	});

	socket.on("authenticate", ({ userId, userType }) => {
		console.log(`User authenticated: ${userId} (${userType})`);
		onlineUsers.set(socket.id, { odI: userId, userType });

		// Track socket for this user
		if (!userSockets.has(userId)) {
			userSockets.set(userId, new Set());
		}
		userSockets.get(userId).add(socket.id);

		// Broadcast online status to relevant users
		socket.broadcast.emit("user_online", { odI: userId, userType });
	});

	// Join a chat room (supports both string and object)
	socket.on("join_chat", (data) => {
		const chatId = typeof data === "string" ? data : data.chatId;
		socket.join(`chat_${chatId}`);
		console.log(`Socket ${socket.id} joined chat: ${chatId}`);
	});

	// Leave a chat room (supports both string and object)
	socket.on("leave_chat", (data) => {
		const chatId = typeof data === "string" ? data : data.chatId;
		socket.leave(`chat_${chatId}`);
		console.log(`Socket ${socket.id} left chat: ${chatId}`);
	});

	// Handle sending a message
	socket.on("send_message", async (data) => {
		try {
			const { chatId, text, senderId, senderType } = data;
			const userData = onlineUsers.get(socket.id);

			// Use identified user info if not provided in data
			const finalSenderId = senderId || userData?.odI;
			const finalSenderType = senderType || userData?.userType;

			if (!chatId || !text || !finalSenderId || !finalSenderType) {
				socket.emit("message_error", {
					error: "Missing required fields",
					chatId,
				});
				return;
			}

			// Create and save the message
			const message = new Message({
				chatId,
				senderId: finalSenderId,
				senderType: finalSenderType,
				text,
				createdAt: new Date(),
			});
			await message.save();

			// Update the chat's lastMessageAt
			await Chat.findByIdAndUpdate(chatId, {
				lastMessageAt: new Date(),
				updatedAt: new Date(),
			});

			// Populate sender info for response
			const populatedMessage = await Message.findById(message._id).populate(
				"senderId",
				"fullname email"
			);

			// Emit to all users in the chat room
			io.to(`chat_${chatId}`).emit("new_message", {
				chatId,
				message: populatedMessage,
			});

			// Acknowledge to sender
			socket.emit("message_sent", {
				chatId,
				messageId: message._id,
				message: populatedMessage,
			});

			console.log(`Message sent in chat ${chatId} by ${finalSenderId}`);
		} catch (error) {
			console.error("Error sending message:", error);
			socket.emit("message_error", {
				error: error.message,
				chatId: data.chatId,
			});
		}
	});

	// Handle typing indicator
	socket.on("typing", (data) => {
		const { chatId, isTyping, userId, userType } = data;
		const userData = onlineUsers.get(socket.id);

		const finalUserId = userId || userData?.odI;
		const finalUserType = userType || userData?.userType;

		// Broadcast typing status to others in the chat
		socket.to(`chat_${chatId}`).emit("user_typing", {
			chatId,
			odI: finalUserId,
			userType: finalUserType,
			isTyping,
		});
	});

	// Handle disconnect
	socket.on("disconnect", () => {
		const userData = onlineUsers.get(socket.id);

		if (userData) {
			const { odI, userType } = userData;

			// Remove this socket from user's socket set
			if (userSockets.has(odI)) {
				userSockets.get(odI).delete(socket.id);

				// If user has no more sockets, they're offline
				if (userSockets.get(odI).size === 0) {
					userSockets.delete(odI);
					socket.broadcast.emit("user_offline", { odI, userType });
				}
			}

			onlineUsers.delete(socket.id);
		}

		console.log(`User disconnected: ${socket.id}`);
	});
});

mongoose.connection.once("open", () => {
	console.log("Connected to MongoDB");
	console.log(`MongoDB Connected: ${mongoose.connection.host}`);
	// Listen on all network interfaces (0.0.0.0) to allow mobile access
	server.listen(PORT, "0.0.0.0", () => {
		const localIP = getLocalIP();
		console.log(`Server running on port ${PORT}`);
		console.log(`Local: http://localhost:${PORT}`);
		console.log(`Network: http://${localIP}:${PORT}`);
	});
});
mongoose.connection.on("error", (err) => {
	console.log(err);
	logEvents(
		`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
		"mongoErrLog.log"
	);
});
