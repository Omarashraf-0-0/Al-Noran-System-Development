const notificationService = require("../services/notificationService");
const Notification = require("../models/notifications");

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
	try {
		const userId = req.user._id;
		const {
			page = 1,
			limit = 20,
			unreadOnly = false,
			type = null,
			priority = null,
		} = req.query;

		const result = await notificationService.getUserNotifications(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
			unreadOnly: unreadOnly === "true",
			type,
			priority,
		});

		res.json({
			success: true,
			...result,
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب الإشعارات",
			error: error.message,
		});
	}
};

/**
 * @desc    Get single notification
 * @route   GET /api/notifications/:id
 * @access  Private
 */
const getNotificationById = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id } = req.params;

		const notification = await Notification.findOne({
			_id: id,
			userId,
		}).populate("senderId", "fullname username");

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "الإشعار غير موجود",
			});
		}

		res.json({
			success: true,
			notification,
		});
	} catch (error) {
		console.error("Error fetching notification:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب الإشعار",
			error: error.message,
		});
	}
};

/**
 * @desc    Get unread count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
	try {
		const userId = req.user._id;
		const count = await notificationService.getUnreadCount(userId);

		res.json({
			success: true,
			unreadCount: count,
		});
	} catch (error) {
		console.error("Error fetching unread count:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب عدد الإشعارات",
			error: error.message,
		});
	}
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id } = req.params;

		const notification = await notificationService.markAsRead(id, userId);

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "الإشعار غير موجود",
			});
		}

		res.json({
			success: true,
			message: "تم تحديد الإشعار كمقروء",
			notification,
		});
	} catch (error) {
		console.error("Error marking notification as read:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديد الإشعار كمقروء",
			error: error.message,
		});
	}
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
	try {
		const userId = req.user._id;
		const result = await notificationService.markAllAsRead(userId);

		res.json({
			success: true,
			message: "تم تحديد جميع الإشعارات كمقروءة",
			modifiedCount: result.modifiedCount,
		});
	} catch (error) {
		console.error("Error marking all as read:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديد الإشعارات كمقروءة",
			error: error.message,
		});
	}
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id } = req.params;

		const notification = await notificationService.deleteNotification(id, userId);

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "الإشعار غير موجود",
			});
		}

		res.json({
			success: true,
			message: "تم حذف الإشعار بنجاح",
		});
	} catch (error) {
		console.error("Error deleting notification:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في حذف الإشعار",
			error: error.message,
		});
	}
};

/**
 * @desc    Archive notification
 * @route   PUT /api/notifications/:id/archive
 * @access  Private
 */
const archiveNotification = async (req, res) => {
	try {
		const userId = req.user._id;
		const { id } = req.params;

		const notification = await notificationService.archiveNotification(id, userId);

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "الإشعار غير موجود",
			});
		}

		res.json({
			success: true,
			message: "تم أرشفة الإشعار بنجاح",
			notification,
		});
	} catch (error) {
		console.error("Error archiving notification:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في أرشفة الإشعار",
			error: error.message,
		});
	}
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/notifications/clear-read
 * @access  Private
 */
const clearReadNotifications = async (req, res) => {
	try {
		const userId = req.user._id;
		
		const result = await Notification.deleteMany({
			userId,
			isRead: true,
		});

		res.json({
			success: true,
			message: "تم حذف الإشعارات المقروءة",
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		console.error("Error clearing read notifications:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في حذف الإشعارات",
			error: error.message,
		});
	}
};

/**
 * @desc    Send notification (Admin only)
 * @route   POST /api/notifications/send
 * @access  Private (Admin/Employee)
 */
const sendNotification = async (req, res) => {
	try {
		const senderId = req.user._id;
		const userType = req.user.type;

		// التحقق من الصلاحيات
		if (userType !== "admin" && userType !== "employee") {
			return res.status(403).json({
				success: false,
				message: "غير مصرح لك بإرسال الإشعارات",
			});
		}

		const {
			userId,
			type = "general",
			title,
			message,
			data = {},
			priority = "medium",
			sendEmail = false,
		} = req.body;

		if (!userId || !title || !message) {
			return res.status(400).json({
				success: false,
				message: "userId, title, and message are required",
			});
		}

		const notification = await notificationService.createNotification({
			userId,
			type,
			title,
			message,
			data,
			priority,
			sendEmail,
			senderId,
		});

		res.status(201).json({
			success: true,
			message: "تم إرسال الإشعار بنجاح",
			notification,
		});
	} catch (error) {
		console.error("Error sending notification:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إرسال الإشعار",
			error: error.message,
		});
	}
};

/**
 * @desc    Send bulk notification (Admin only)
 * @route   POST /api/notifications/send-bulk
 * @access  Private (Admin)
 */
const sendBulkNotification = async (req, res) => {
	try {
		const senderId = req.user._id;
		const userType = req.user.type;

		// التحقق من الصلاحيات
		if (userType !== "admin") {
			return res.status(403).json({
				success: false,
				message: "غير مصرح لك بإرسال الإشعارات الجماعية",
			});
		}

		const {
			userIds,
			type = "general",
			title,
			message,
			data = {},
			priority = "medium",
			sendEmail = false,
		} = req.body;

		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return res.status(400).json({
				success: false,
				message: "userIds array is required",
			});
		}

		if (!title || !message) {
			return res.status(400).json({
				success: false,
				message: "title and message are required",
			});
		}

		const notifications = await notificationService.createBulkNotifications(
			userIds,
			{
				type,
				title,
				message,
				data,
				priority,
				sendEmail,
				senderId,
			}
		);

		res.status(201).json({
			success: true,
			message: `تم إرسال ${notifications.length} إشعار بنجاح`,
			sentCount: notifications.length,
		});
	} catch (error) {
		console.error("Error sending bulk notification:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إرسال الإشعارات",
			error: error.message,
		});
	}
};

/**
 * @desc    Update FCM token
 * @route   PUT /api/notifications/fcm-token
 * @access  Private
 */
const updateFCMToken = async (req, res) => {
	try {
		const userId = req.user._id;
		const { fcmToken } = req.body;

		console.log(`📱 [FCM Token Update] User: ${userId}`);
		console.log(`📱 [FCM Token Update] Token: ${fcmToken ? fcmToken.substring(0, 30) + '...' : 'EMPTY'}`);

		if (!fcmToken) {
			return res.status(400).json({
				success: false,
				message: "fcmToken is required",
			});
		}

		// Update user's FCM token
		const User = require("../models/user");
		const updatedUser = await User.findByIdAndUpdate(
			userId, 
			{ fcmToken },
			{ new: true }
		);

		console.log(`📱 [FCM Token Update] Updated user fcmToken: ${updatedUser?.fcmToken ? 'SET ✅' : 'NOT SET ❌'}`);

		res.json({
			success: true,
			message: "تم تحديث FCM token بنجاح",
		});
	} catch (error) {
		console.error("Error updating FCM token:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديث FCM token",
			error: error.message,
		});
	}
};

/**
 * @desc    Get notification settings
 * @route   GET /api/notifications/settings
 * @access  Private
 */
const getNotificationSettings = async (req, res) => {
	try {
		const userId = req.user._id;
		const User = require("../models/user");
		
		const user = await User.findById(userId).select("notificationSettings");

		res.json({
			success: true,
			settings: user?.notificationSettings || {
				pushEnabled: true,
				emailEnabled: true,
				shipmentUpdates: true,
				documentUpdates: true,
				paymentReminders: true,
				chatMessages: true,
			},
		});
	} catch (error) {
		console.error("Error fetching notification settings:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب إعدادات الإشعارات",
			error: error.message,
		});
	}
};

/**
 * @desc    Update notification settings
 * @route   PUT /api/notifications/settings
 * @access  Private
 */
const updateNotificationSettings = async (req, res) => {
	try {
		const userId = req.user._id;
		const settings = req.body;

		const User = require("../models/user");
		await User.findByIdAndUpdate(userId, {
			notificationSettings: settings,
		});

		res.json({
			success: true,
			message: "تم تحديث إعدادات الإشعارات بنجاح",
			settings,
		});
	} catch (error) {
		console.error("Error updating notification settings:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديث إعدادات الإشعارات",
			error: error.message,
		});
	}
};


const getEmployeeNotifications = async (req, res) => {
	try {
		console.log("here");
		const  employeeId  = req.body._id;
		console.log(employeeId);
		const notifications = await notificationService.getEmployeeNotificationsById(employeeId);

		console.log(notifications);
		return res.status(200).json({
			success: true,
			count: notifications.length,
			data: notifications,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};



module.exports = {
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
};
