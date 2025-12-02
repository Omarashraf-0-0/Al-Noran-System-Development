const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
	chatId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Chat",
		required: true,
	},
	senderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	senderType: {
		type: String,
		enum: ["client", "employee"],
		required: true,
	},
	text: {
		type: String,
		required: true,
		trim: true,
	},
	isRead: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const chatSchema = new mongoose.Schema({
	clientId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	employeeId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true, // Now required - employee assigned from shipment
	},
	shipmentId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Shipment",
		required: true, // Now required - chat is always linked to a shipment
	},
	status: {
		type: String,
		enum: ["active", "resolved", "pending"],
		default: "active", // Active by default since employee is assigned
	},
	lastMessageAt: {
		type: Date,
		default: Date.now,
	},
	unreadCount: {
		type: Number,
		default: 0,
	},
	clientTyping: {
		type: Boolean,
		default: false,
	},
	employeeTyping: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Update lastMessageAt and updatedAt before saving
chatSchema.pre("save", function (next) {
	this.updatedAt = Date.now();
	next();
});

const Chat = mongoose.model("Chat", chatSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = { Chat, Message };
