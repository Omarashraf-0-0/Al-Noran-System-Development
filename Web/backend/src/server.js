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

// --- 1. استيراد المكتبات الجديدة ---
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);

connectDB();

// --- 2. إنشاء سيرفر HTTP وربطه بـ Express و Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		credentials: true,
		allowedHeaders: ["*"],
	},
	transports: ["websocket", "polling"],
	allowEIO3: true,
});

app.use(
	cors({
		origin: "http://localhost:5173",
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

app.use(
	"/",
	express.static(path.join(__dirname, "..", "..", "frontend", "public"))
);
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
app.use("/api/chat", require("./routes/chatRoutes")); // Chat Routes
app.use("/api/upload/users", require("./routes/uploadRoutes"));
app.use("/api/upload/shipments", require("./routes/uploadRoutes"));
app.use("/api/uploads", require("./routes/uploadS3Routes")); // S3 Upload Routes
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
const User = require("./models/user");
const { Chat, Message } = require("./models/chat");

// Store active connections: { userId: socketId }
const activeConnections = new Map();

io.on("connection", (socket) => {
	console.log(`User connected: ${socket.id}`);

	// Handle user authentication and join personal room
	socket.on("authenticate", async (data) => {
		try {
			const { userId, userType } = data;
			
			if (!userId) return;

			// Store user info in socket for later use
			socket.userId = userId;
			socket.userType = userType;

			// Join user's personal room
			socket.join(`user_${userId}`);
			activeConnections.set(userId, socket.id);

			console.log(`User authenticated: ${userId} (${userType})`);

			// Update online status for employees
			if (userType === "employee") {
				await User.findByIdAndUpdate(userId, {
					"employeeDetails.isOnline": true,
					"employeeDetails.socketId": socket.id,
				});
				
				// Notify all clients about employee online status
				io.emit("employee_status", {
					employeeId: userId,
					isOnline: true,
				});
			}

			console.log(`User ${userId} authenticated and joined room`);
		} catch (error) {
			console.error("Authentication error:", error);
		}
	});

	// Join a chat room
	socket.on("join_chat", async (data) => {
		try {
			const { chatId, userId } = data;
			
			if (!chatId) return;

			socket.join(`chat_${chatId}`);
			console.log(`User ${userId} joined chat ${chatId}`);

			// Mark messages as read
			const chat = await Chat.findById(chatId);
			if (chat) {
				const isClient = chat.clientId.toString() === userId;
				await Message.updateMany(
					{
						chatId,
						senderType: isClient ? "employee" : "client",
						isRead: false,
					},
					{ isRead: true }
				);

				// Reset unread count
				chat.unreadCount = 0;
				await chat.save();

				// Notify other party
				socket.to(`chat_${chatId}`).emit("messages_read", { chatId });
			}
		} catch (error) {
			console.error("Join chat error:", error);
		}
	});

	// Handle new message
	socket.on("send_message", async (data) => {
		try {
			let { chatId, senderId, senderType, text } = data;

			// If senderId or senderType not provided, get from authenticated socket
			if (!senderId && socket.userId) {
				senderId = socket.userId;
			}
			if (!senderType && socket.userType) {
				senderType = socket.userType;
			}

			console.log("Received send_message:", {
				chatId,
				senderId,
				senderType,
				textLength: text?.length,
				hasText: !!text,
				hasChatId: !!chatId,
				hasSenderId: !!senderId,
				fromAuth: !data.senderId && !!socket.userId,
			});

			if (!text || !chatId || !senderId || !senderType) {
				console.error("Missing fields - rejecting message", {
					hasText: !!text,
					hasChatId: !!chatId,
					hasSenderId: !!senderId,
					hasSenderType: !!senderType,
				});
				socket.emit("message_error", { message: "Missing required fields" });
				return;
			}

			// Validate senderType
			if (!["client", "employee"].includes(senderType)) {
				console.error("Invalid senderType:", senderType);
				socket.emit("message_error", { message: "Invalid sender type" });
				return;
			}

			// Create message
			const message = new Message({
				chatId,
				senderId,
				senderType,
				text: text.trim(),
			});

			await message.save();

			// Update chat
			const chat = await Chat.findById(chatId);
			if (chat) {
				chat.lastMessageAt = Date.now();
				chat.unreadCount += 1;
				
				// Auto-assign employee if first message from employee
				if (senderType === "employee" && !chat.employeeId) {
					chat.employeeId = senderId;
					chat.status = "active";
					
					// Notify client about assignment
					io.to(`user_${chat.clientId}`).emit("agent_assigned", {
						chatId,
						employeeId: senderId,
					});
				}

				if (chat.status === "pending") {
					chat.status = "active";
				}

				await chat.save();
			}

			// Populate sender info
			const populatedMessage = await Message.findById(message._id).populate(
				"senderId",
				"fullname username type"
			);

			// Emit to chat room
			io.to(`chat_${chatId}`).emit("new_message", populatedMessage);

			// Send acknowledgment to sender
			socket.emit("message_sent", { 
				messageId: message._id,
				chatId 
			});

			console.log(`Message sent in chat ${chatId}`);
		} catch (error) {
			console.error("Send message error:", error);
			socket.emit("message_error", { message: error.message });
		}
	});

	// Handle typing indicator
	socket.on("typing", async (data) => {
		try {
			let { chatId, userId, userType, isTyping } = data;

			// If userId or userType not provided, get from authenticated socket
			if (!userId && socket.userId) {
				userId = socket.userId;
			}
			if (!userType && socket.userType) {
				userType = socket.userType;
			}

			if (!chatId) {
				console.error("Typing: missing chatId");
				return;
			}

			// Validate isTyping is boolean
			if (typeof isTyping !== "boolean") {
				console.error("Typing: isTyping must be boolean, got:", typeof isTyping, isTyping);
				return;
			}

			// Validate userType
			if (!["client", "employee"].includes(userType)) {
				console.error("Typing: invalid userType:", userType);
				return;
			}

			console.log("Typing indicator:", { chatId, userId, userType, isTyping });

			// Update chat typing status
			const chat = await Chat.findById(chatId);
			if (chat) {
				if (userType === "client") {
					chat.clientTyping = isTyping;
				} else {
					chat.employeeTyping = isTyping;
				}
				await chat.save();
			}

			// Emit to other party in chat
			socket.to(`chat_${chatId}`).emit("user_typing", {
				chatId,
				userType,
				isTyping,
			});
		} catch (error) {
			console.error("Typing indicator error:", error);
		}
	});

	// Auto-assign agent to pending chat
	socket.on("request_agent", async (data) => {
		try {
			const { chatId } = data;

			const chat = await Chat.findById(chatId);
			if (!chat || chat.employeeId) return;

			// Find available employees (online and with least active chats)
			const onlineEmployees = await User.find({
				type: "employee",
				"employeeDetails.isOnline": true,
			});

			if (onlineEmployees.length === 0) {
				socket.emit("no_agents_available", { chatId });
				return;
			}

			// Count active chats for each employee
			const employeeChats = await Promise.all(
				onlineEmployees.map(async (emp) => {
					const count = await Chat.countDocuments({
						employeeId: emp._id,
						status: "active",
					});
					return { employeeId: emp._id, count };
				})
			);

			// Find employee with least active chats
			const leastBusy = employeeChats.reduce((min, curr) =>
				curr.count < min.count ? curr : min
			);

			// Assign chat
			chat.employeeId = leastBusy.employeeId;
			chat.status = "active";
			await chat.save();

			const populatedChat = await Chat.findById(chatId)
				.populate("clientId", "fullname username")
				.populate("employeeId", "fullname username");

			// Notify employee
			io.to(`user_${leastBusy.employeeId}`).emit("new_chat_assigned", populatedChat);

			// Notify client
			socket.emit("agent_assigned", {
				chatId,
				employeeId: leastBusy.employeeId,
				employeeName: populatedChat.employeeId.fullname,
			});

			console.log(`Chat ${chatId} assigned to employee ${leastBusy.employeeId}`);
		} catch (error) {
			console.error("Agent assignment error:", error);
		}
	});

	// Handle shipment room (existing functionality)
	socket.on("joinShipmentRoom", (acid) => {
		socket.join(acid);
		console.log(`Socket ${socket.id} joined room for ACID: ${acid}`);
	});

	// Handle disconnect
	socket.on("disconnect", async () => {
		console.log(`User disconnected: ${socket.id}`);

		// Find and update user online status
		try {
			const user = await User.findOne({
				"employeeDetails.socketId": socket.id,
			});

			if (user) {
				user.employeeDetails.isOnline = false;
				user.employeeDetails.socketId = null;
				await user.save();

				// Remove from active connections
				activeConnections.delete(user._id.toString());

				// Notify all clients
				io.emit("employee_status", {
					employeeId: user._id,
					isOnline: false,
				});

				console.log(`Employee ${user._id} went offline`);
			}
		} catch (error) {
			console.error("Disconnect error:", error);
		}
	});
});

mongoose.connection.once("open", () => {
	console.log("Connected to MongoDB");
	// Listen on all network interfaces (0.0.0.0) to allow mobile access
	server.listen(PORT, "0.0.0.0", () => {
		console.log(`Server running on port ${PORT}`);
		console.log(`Local: http://localhost:${PORT}`);
		console.log(`Network: http://192.168.1.14:${PORT}`);
	});
});
mongoose.connection.on("error", (err) => {
	console.log(err);
	logEvents(
		`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
		"mongoErrLog.log"
	);
});
