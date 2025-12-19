const { Chat, Message } = require("../models/chat");
const User = require("../models/user");
const Shipment = require("../models/shipment");
const notificationService = require("../services/notificationService");

// Get all chats for a user (client sees their chats, employee sees chats for their assigned shipments)
const getChats = async (req, res) => {
	try {
		const userId = req.user._id;
		const userType = req.user.type;

		let chats;

		if (userType === "client") {
			// Client can only see their own chats (based on shipments they own)
			chats = await Chat.find({ clientId: userId })
				.populate("clientId", "fullname username email")
				.populate("employeeId", "fullname username email")
				.populate("shipmentId", "acid status country")
				.sort({ lastMessageAt: -1 });
		} else if (userType === "employee") {
			// Employee sees chats for shipments assigned to them
			chats = await Chat.find({ employeeId: userId })
				.populate("clientId", "fullname username email")
				.populate("employeeId", "fullname username email")
				.populate("shipmentId", "acid status country")
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

// Get or create a chat for a specific shipment
const getOrCreateChat = async (req, res) => {
	try {
		const userId = req.user._id;
		let userType = req.user.type || req.user.userType;
		const { shipmentId } = req.body;

		console.log("getOrCreateChat called:", {
			userId: userId.toString(),
			userType,
			username: req.user.username,
			shipmentId,
		});

		if (!shipmentId) {
			return res.status(400).json({
				success: false,
				message: "Shipment ID is required",
			});
		}

		// Verify shipment exists
		const shipment = await Shipment.findById(shipmentId);
		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "Shipment not found",
			});
		}

		// Check if shipment has an assigned employee
		if (!shipment.employee_id) {
			return res.status(400).json({
				success: false,
				message: "No employee assigned to this shipment yet. Please wait for assignment.",
			});
		}

		// If userType is not in token, determine from shipment ownership
		if (!userType) {
			console.log("⚠️ No userType in token, determining from shipment...");
			if (shipment.user_id.toString() === userId.toString()) {
				userType = "client";
				console.log("✅ Determined userType as 'client' from shipment ownership");
			} else if (shipment.employee_id.toString() === userId.toString()) {
				userType = "employee";
				console.log("✅ Determined userType as 'employee' from shipment assignment");
			} else {
				console.log("❌ User has no relation to this shipment");
				return res.status(403).json({
					success: false,
					message: "You don't have access to this shipment",
				});
			}
		}

		// Verify user has access to this shipment
		if (userType === "client") {
			if (shipment.user_id.toString() !== userId.toString()) {
				return res.status(403).json({
					success: false,
					message: "You don't have access to this shipment",
				});
			}
		} else if (userType === "employee") {
			if (shipment.employee_id.toString() !== userId.toString()) {
				return res.status(403).json({
					success: false,
					message: "This shipment is not assigned to you",
				});
			}
		}

		// Determine the client and employee IDs
		const clientId = userType === "client" ? userId : shipment.user_id;
		const employeeId = shipment.employee_id;

		// Check if chat already exists for this shipment
		let chat = await Chat.findOne({ shipmentId })
			.populate("clientId", "fullname username email")
			.populate("employeeId", "fullname username email")
			.populate("shipmentId", "acid status country");

		console.log("Existing chat found:", chat ? {
			chatId: chat._id.toString(),
			shipmentId: chat.shipmentId._id.toString(),
			chatClientId: chat.clientId._id.toString(),
			currentClientId: clientId.toString(),
		} : "No existing chat");

		if (!chat) {
			// Create new chat linking client and employee through shipment
			chat = new Chat({
				clientId: clientId,
				employeeId: employeeId,
				shipmentId: shipmentId,
				status: "active",
			});
			await chat.save();

			// Populate after save
			chat = await Chat.findById(chat._id)
				.populate("clientId", "fullname username email")
				.populate("employeeId", "fullname username email")
				.populate("shipmentId", "acid status country");
		} else {
			// If chat exists but has wrong clientId or employeeId, update it
			let needsUpdate = false;
			if (chat.clientId._id.toString() !== clientId.toString()) {
				console.log("Updating chat clientId from", chat.clientId._id.toString(), "to", clientId.toString());
				chat.clientId = clientId;
				needsUpdate = true;
			}
			if (chat.employeeId._id.toString() !== employeeId.toString()) {
				console.log("Updating chat employeeId from", chat.employeeId._id.toString(), "to", employeeId.toString());
				chat.employeeId = employeeId;
				needsUpdate = true;
			}
			if (needsUpdate) {
				await chat.save();
				// Re-populate after update
				chat = await Chat.findById(chat._id)
					.populate("clientId", "fullname username email")
					.populate("employeeId", "fullname username email")
					.populate("shipmentId", "acid status country");
			}
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
		let userType = req.user.type || req.user.userType;

		// Verify user has access to this chat
		const chat = await Chat.findById(chatId);

		if (!chat) {
			return res.status(404).json({
				success: false,
				message: "Chat not found",
			});
		}

		console.log("getMessages - User:", { userId: userId.toString(), userType });
		console.log("getMessages - Chat:", { 
			clientId: chat.clientId?.toString(), 
			employeeId: chat.employeeId?.toString(),
			shipmentId: chat.shipmentId?.toString()
		});

		// If userType is not in token, determine from chat
		if (!userType) {
			console.log("⚠️ No userType in token for getMessages, determining from chat...");
			if (chat.clientId.toString() === userId.toString()) {
				userType = "client";
				console.log("✅ Determined userType as 'client'");
			} else if (chat.employeeId && chat.employeeId.toString() === userId.toString()) {
				userType = "employee";
				console.log("✅ Determined userType as 'employee'");
			} else {
				console.log("❌ User has no access to this chat");
				return res.status(403).json({
					success: false,
					message: "Access denied to this chat",
				});
			}
		}

		// Check authorization
		if (userType === "client") {
			if (chat.clientId.toString() !== userId.toString()) {
				console.log("Client access denied - IDs don't match");
				return res.status(403).json({
					success: false,
					message: "Access denied to this chat",
				});
			}
		} else if (userType === "employee") {
			if (chat.employeeId.toString() !== userId.toString()) {
				console.log("Employee access denied - IDs don't match");
				return res.status(403).json({
					success: false,
					message: "Access denied to this chat",
				});
			}
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
		let userType = req.user.type || req.user.userType;

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

		// Determine sender type from chat if not in token (fallback for old tokens)
		if (!userType) {
			console.log("⚠️ No userType in token, checking chat ownership...");
			console.log("Chat clientId:", chat.clientId.toString());
			console.log("Chat employeeId:", chat.employeeId ? chat.employeeId.toString() : "null");
			console.log("Current userId:", userId.toString());
			
			if (chat.clientId.toString() === userId.toString()) {
				userType = "client";
				console.log("✅ Determined user type as 'client' from chat");
			} else if (
				chat.employeeId &&
				chat.employeeId.toString() === userId.toString()
			) {
				userType = "employee";
				console.log("✅ Determined user type as 'employee' from chat");
			} else {
				console.log("❌ User not in chat - unauthorized");
				return res.status(403).json({
					success: false,
					message: "User not authorized for this chat",
				});
			}
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

		// Create the message
		console.log("Creating message with data:", {
			chatId,
			senderId: userId.toString(),
			senderType: userType,
			textLength: text.trim().length,
		});

		const message = new Message({
			chatId,
			senderId: userId,
			senderType: userType,
			text: text.trim(),
		});

		console.log("Message object created, attempting to save...");
		await message.save();
		console.log("Message saved successfully with ID:", message._id);

		// Update chat lastMessageAt
		console.log("Updating chat lastMessageAt...");
		chat.lastMessageAt = Date.now();
		if (chat.status === "pending") {
			chat.status = "active";
		}
		await chat.save();
		console.log("Chat updated successfully");

		// Populate sender info
		console.log("Populating sender information...");
		const populatedMessage = await Message.findById(message._id).populate(
			"senderId",
			"fullname username type"
		);
		console.log("Sender populated successfully:", populatedMessage.senderId?.fullname);

		// 📬 Send notification to the other party in the chat
		try {
			const senderName = populatedMessage.senderId?.fullname || "Someone";
			// Determine recipient - if sender is client, notify employee and vice versa
			let recipientId = null;
			if (userType === "client" && chat.employeeId) {
				recipientId = chat.employeeId;
			} else if (userType === "employee") {
				recipientId = chat.clientId;
			}
			
			if (recipientId) {
				await notificationService.notifyChatMessage(recipientId, chatId, senderName);
				console.log(`📬 Chat notification sent to ${recipientId}`);
			}
		} catch (notifError) {
			console.error("Failed to send chat notification:", notifError.message);
		}

		res.status(201).json({
			success: true,
			message: populatedMessage,
		});
	} catch (error) {
		console.error("❌ Error sending message:");
		console.error("Error name:", error.name);
		console.error("Error message:", error.message);
		console.error("Error stack:", error.stack);
		console.error("Chat ID:", req.params.chatId);
		console.error("User ID:", req.user?._id);
		console.error("User Type:", req.user?.type);

		res.status(500).json({
			success: false,
			message: "Server error while sending message",
			error: error.message,
			errorType: error.name,
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

		// Emit event via Socket.IO
		if (req.io) {
			req.io.to(`chat_${chatId}`).emit("chat_resolved", { chatId });
		}

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

// Get online employees
const getOnlineEmployees = async (req, res) => {
	try {
		const employees = await User.find({
			type: "employee",
			"employeeDetails.isOnline": true,
		}).select("fullname username employeeDetails");

		res.json({
			success: true,
			employees,
			count: employees.length,
		});
	} catch (error) {
		console.error("Error fetching online employees:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching online employees",
			error: error.message,
		});
	}
};

// Get customers for an employee (based on assigned shipments)
const getMyCustomers = async (req, res) => {
	try {
		const userId = req.user._id;
		const userType = req.user.type;

		if (userType !== "employee") {
			return res.status(403).json({
				success: false,
				message: "Only employees can access this endpoint",
			});
		}

		// Find all shipments assigned to this employee
		const shipments = await Shipment.find({ employee_id: userId })
			.populate("user_id", "fullname username email")
			.select("acid status country user_id");

		// Extract unique customers
		const customersMap = new Map();
		shipments.forEach((shipment) => {
			if (shipment.user_id) {
				const clientId = shipment.user_id._id.toString();
				if (!customersMap.has(clientId)) {
					customersMap.set(clientId, {
						_id: shipment.user_id._id,
						fullname: shipment.user_id.fullname,
						username: shipment.user_id.username,
						email: shipment.user_id.email,
						shipments: [],
					});
				}
				customersMap.get(clientId).shipments.push({
					_id: shipment._id,
					acid: shipment.acid,
					status: shipment.status,
					country: shipment.country,
				});
			}
		});

		const customers = Array.from(customersMap.values());

		res.json({
			success: true,
			customers,
			count: customers.length,
		});
	} catch (error) {
		console.error("Error fetching customers:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching customers",
			error: error.message,
		});
	}
};

// Mark messages as delivered
const markAsDelivered = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userId = req.user._id;

		const chat = await Chat.findById(chatId);
		if (!chat) {
			return res.status(404).json({
				success: false,
				message: "Chat not found",
			});
		}

		// Update undelivered messages
		await Message.updateMany(
			{
				chatId,
				senderId: { $ne: userId },
				isRead: false,
			},
			{ isRead: true }
		);

		// Reset unread count
		chat.unreadCount = 0;
		await chat.save();

		res.json({
			success: true,
			message: "Messages marked as delivered",
		});
	} catch (error) {
		console.error("Error marking messages:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
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
	getOnlineEmployees,
	getMyCustomers,
	markAsDelivered,
};
