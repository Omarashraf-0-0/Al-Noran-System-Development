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
} = require("../controllers/chatController");

// @route   GET /api/chat
// @desc    Get all chats for current user
router.get("/", protect, getChats);

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

module.exports = router;
