const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
	getChats,
	getOrCreateChat,
	getMessages,
	sendMessage,
	assignChat,
	resolveChat,
	getOnlineEmployees,
	getMyCustomers,
	markAsDelivered,
} = require("../controllers/chatController");

// @route   GET /api/chat
// @desc    Get all chats for current user
router.get("/", protect, getChats);

// @route   GET /api/chat/employees/online
// @desc    Get all online employees
router.get("/employees/online", protect, getOnlineEmployees);

// @route   GET /api/chat/my-customers
// @desc    Get all customers for an employee (based on assigned shipments)
router.get("/my-customers", protect, getMyCustomers);

// @route   POST /api/chat
// @desc    Get or create a chat (for clients)
router.post("/", protect, getOrCreateChat);

// @route   GET /api/chat/:chatId/messages
// @desc    Get all messages in a chat
router.get("/:chatId/messages", protect, getMessages);

// @route   POST /api/chat/:chatId/messages
// @desc    Send a message in a chat
router.post("/:chatId/messages", protect, sendMessage);

// @route   POST /api/chat/:chatId/assign
// @desc    Assign chat to current employee
router.post("/:chatId/assign", protect, assignChat);

// @route   PATCH /api/chat/:chatId/resolve
// @desc    Resolve/close a chat
router.patch("/:chatId/resolve", protect, resolveChat);

// @route   PATCH /api/chat/:chatId/delivered
// @desc    Mark messages as delivered
router.patch("/:chatId/delivered", protect, markAsDelivered);

module.exports = router;
