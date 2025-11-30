const { Chat, Message } = require("../models/chat");
const User = require("../models/user");
const Shipment = require("../models/shipment");

// Get all chats for a user (client sees their chats, employee sees all active chats)
const getChats = async (req, res) => {
	try {
		const userId = req.user._id;
		const userType = req.user.type;

		let chats;

		if (userType === "client") {
			// Client can only see their own chats
			chats = await Chat.find({ clientId: userId })
				.populate("clientId", "fullname username")
				.populate("employeeId", "fullname username")
				.populate("shipmentId", "acid")
				.sort({ lastMessageAt: -1 });
		} else if (userType === "employee") {
			// Employee can see all chats or chats assigned to them
			chats = await Chat.find({
				$or: [
					{ employeeId: userId },
					{ employeeId: null }, // Unassigned chats
					{ status: "active" },
				],
			})
				.populate("clientId", "fullname username")
				.populate("employeeId", "fullname username")
				.populate("shipmentId", "acid")
				.sort({ lastMessageAt: -1 });
		} else {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		res.json({
			success: true,
			chats,
		});
	} catch (error) {
		console.error("Error fetching chats:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching chats",
			error: error.message,
		});
	}
};

// Get or create a chat for a client
const getOrCreateChat = async (req, res) => {
	try {
		const userId = req.user._id;
		const userType = req.user.type;
		const { shipmentId } = req.body;

		if (userType !== "client") {
			return res.status(403).json({
				success: false,
				message: "Only clients can create support chats",
			});
		}

		// Check if chat already exists for this client
		let chat = await Chat.findOne({
			clientId: userId,
			status: { $ne: "resolved" }, // Not resolved
		})
			.populate("clientId", "fullname username")
			.populate("employeeId", "fullname username")
			.populate("shipmentId", "acid");

		if (!chat) {
			// Create new chat
			chat = new Chat({
				clientId: userId,
				shipmentId: shipmentId || null,
				status: "pending",
			});
			await chat.save();

			// Populate after save
			chat = await Chat.findById(chat._id)
				.populate("clientId", "fullname username")
				.populate("employeeId", "fullname username")
				.populate("shipmentId", "acid");
		}

		res.json({
			success: true,
			chat,
		});
	} catch (error) {
		console.error("Error getting/creating chat:", error);
		res.status(500).json({
			success: false,
			message: "Server error while creating chat",
			error: error.message,
		});
	}
};

// Get messages for a specific chat
const getMessages = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userId = req.user._id;
		const userType = req.user.type;

		// Verify user has access to this chat
		const chat = await Chat.findById(chatId);

		if (!chat) {
			return res.status(404).json({
				success: false,
				message: "Chat not found",
			});
		}

		// Check authorization
		if (
			userType === "client" &&
			chat.clientId.toString() !== userId.toString()
		) {
			return res.status(403).json({
				success: false,
				message: "Access denied to this chat",
			});
		}

		const messages = await Message.find({ chatId })
			.populate("senderId", "fullname username type")
			.sort({ createdAt: 1 });

		// Mark messages as read if user is viewing them
		if (userType === "employee") {
			await Message.updateMany(
				{ chatId, senderType: "client", isRead: false },
				{ isRead: true }
			);
		} else if (userType === "client") {
			await Message.updateMany(
				{ chatId, senderType: "employee", isRead: false },
				{ isRead: true }
			);
		}

		res.json({
			success: true,
			messages,
		});
	} catch (error) {
		console.error("Error fetching messages:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching messages",
			error: error.message,
		});
	}
};

// Send a message in a chat
const sendMessage = async (req, res) => {
	try {
		const { chatId } = req.params;
		const { text } = req.body;
		const userId = req.user._id;
		const userType = req.user.type;

		if (!text || text.trim() === "") {
			return res.status(400).json({
				success: false,
				message: "Message text is required",
			});
		}

		// Verify chat exists and user has access
		const chat = await Chat.findById(chatId);

		if (!chat) {
			return res.status(404).json({
				success: false,
				message: "Chat not found",
			});
		}

		// Check authorization
		if (
			userType === "client" &&
			chat.clientId.toString() !== userId.toString()
		) {
			return res.status(403).json({
				success: false,
				message: "Access denied to this chat",
			});
		}

		if (
			userType === "employee" &&
			chat.employeeId &&
			chat.employeeId.toString() !== userId.toString()
		) {
			return res.status(403).json({
				success: false,
				message: "This chat is assigned to another employee",
			});
		}

		// If employee is sending first message, assign them to the chat
		if (userType === "employee" && !chat.employeeId) {
			chat.employeeId = userId;
			chat.status = "active";
		}

		// Create message
		const message = new Message({
			chatId,
			senderId: userId,
			senderType: userType,
			text: text.trim(),
		});

		await message.save();

		// Update chat lastMessageAt
		chat.lastMessageAt = Date.now();
		if (chat.status === "pending") {
			chat.status = "active";
		}
		await chat.save();

		// Populate sender info
		const populatedMessage = await Message.findById(message._id).populate(
			"senderId",
			"fullname username type"
		);

		res.status(201).json({
			success: true,
			message: populatedMessage,
		});
	} catch (error) {
		console.error("Error sending message:", error);
		res.status(500).json({
			success: false,
			message: "Server error while sending message",
			error: error.message,
		});
	}
};

// Assign chat to employee
const assignChat = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userId = req.user._id;
		const userType = req.user.type;

		if (userType !== "employee") {
			return res.status(403).json({
				success: false,
				message: "Only employees can assign chats",
			});
		}

		const chat = await Chat.findById(chatId);

		if (!chat) {
			return res.status(404).json({
				success: false,
				message: "Chat not found",
			});
		}

		chat.employeeId = userId;
		chat.status = "active";
		await chat.save();

		const updatedChat = await Chat.findById(chatId)
			.populate("clientId", "fullname username")
			.populate("employeeId", "fullname username")
			.populate("shipmentId", "acid");

		res.json({
			success: true,
			chat: updatedChat,
		});
	} catch (error) {
		console.error("Error assigning chat:", error);
		res.status(500).json({
			success: false,
			message: "Server error while assigning chat",
			error: error.message,
		});
	}
};

// Resolve/close a chat
const resolveChat = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userType = req.user.type;

		if (userType !== "employee") {
			return res.status(403).json({
				success: false,
				message: "Only employees can resolve chats",
			});
		}

		const chat = await Chat.findById(chatId);

		if (!chat) {
			return res.status(404).json({
				success: false,
				message: "Chat not found",
			});
		}

		chat.status = "resolved";
		await chat.save();

		res.json({
			success: true,
			message: "Chat resolved successfully",
		});
	} catch (error) {
		console.error("Error resolving chat:", error);
		res.status(500).json({
			success: false,
			message: "Server error while resolving chat",
			error: error.message,
		});
	}
};

module.exports = {
	getChats,
	getOrCreateChat,
	getMessages,
	sendMessage,
	assignChat,
	resolveChat,
};
