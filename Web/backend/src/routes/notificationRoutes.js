const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
	getNotifications,
	getNotificationById,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	archiveNotification,
	clearReadNotifications,
	sendNotification,
	sendBulkNotification,
	updateFCMToken,
	getNotificationSettings,
	updateNotificationSettings,
	getEmployeeNotifications,
} = require("../controllers/notificationController");

// =====================================================
// PUBLIC ROUTES
// =====================================================
// None - all notification routes require authentication

// =====================================================
// PROTECTED ROUTES (Require Authentication)
// =====================================================

// Get unread count - مهم أن يكون قبل /:id لأنه specific route
router.get("/unread-count", protect, getUnreadCount);

// Mark all as read
router.put("/read-all", protect, markAllAsRead);

// Clear read notifications
router.delete("/clear-read", protect, clearReadNotifications);

// Get employee notifications
router.get("/employee-notifications", protect, getEmployeeNotifications);

// FCM Token
router.put("/fcm-token", protect, updateFCMToken);

// Notification settings
router.get("/settings", protect, getNotificationSettings);
router.put("/settings", protect, updateNotificationSettings);

// Send notification (Admin/Employee only)
router.post("/send", protect, sendNotification);

// Send bulk notification (Admin only)
router.post("/send-bulk", protect, sendBulkNotification);

// Get all notifications
router.get("/", protect, getNotifications);

// Get single notification
router.get("/:id", protect, getNotificationById);

// Mark as read
router.put("/:id/read", protect, markAsRead);

// Archive notification
router.put("/:id/archive", protect, archiveNotification);

// Delete notification
router.delete("/:id", protect, deleteNotification);


module.exports = router;
