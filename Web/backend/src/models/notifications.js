const mongoose = require("mongoose");

/**
 * Notification Types:
 * - registration: تسجيل حساب جديد
 * - document_uploaded: رفع مستند
 * - document_approved: قبول مستند
 * - document_rejected: رفض مستند
 * - document_requested: طلب مستند
 * - acid_created: إنشاء طلب ACID
 * - acid_reviewing: جاري مراجعة ACID
 * - acid_issued: إصدار رقم ACID
 * - acid_rejected: رفض طلب ACID
 * - shipment_created: إنشاء شحنة
 * - shipment_status_changed: تغيير حالة الشحنة
 * - shipment_arrived: وصول الشحنة
 * - shipment_completed: اكتمال الشحنة
 * - shipment_documents_requested: طلب مستندات للشحنة
 * - ucr_created: إنشاء طلب UCR
 * - ucr_reviewing: جاري مراجعة UCR
 * - ucr_approved: قبول طلب UCR
 * - ucr_rejected: رفض طلب UCR
 * - ucr_certificate_issued: إصدار شهادة المنشأ
 * - invoice_created: إنشاء فاتورة
 * - payment_reminder: تذكير بالدفع
 * - payment_received: استلام الدفع
 * - chat_message: رسالة جديدة
 * - account_activated: تفعيل الحساب
 * - password_changed: تغيير كلمة المرور
 * - security_alert: تنبيه أمني
 * - general: إشعار عام
 */

const notificationSchema = new mongoose.Schema(
	{
		// المستلم
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},

		// المرسل (اختياري - قد يكون النظام)
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},

		// نوع الإشعار
		type: {
			type: String,
			enum: [
				// Registration & Auth
				"registration",
				"account_activated",
				"password_changed",
				"security_alert",
				"otp_sent",

				// Documents
				"document_uploaded",
				"document_approved",
				"document_rejected",
				"document_requested",
				"document_expiring",

				// ACID Requests
				"acid_created",
				"acid_reviewing",
				"acid_issued",
				"acid_rejected",
				"acid_documents_requested",

				// Shipments
				"shipment_created",
				"shipment_status_changed",
				"shipment_arrived",
				"shipment_completed",
				"shipment_documents_requested",

				// UCR / Export
				"ucr_created",
				"ucr_reviewing",
				"ucr_approved",
				"ucr_rejected",
				"ucr_certificate_issued",
				"ucr_documents_requested",
				"export_shipment_status_changed",
				"export_shipment_created",

				// Finance
				"invoice_created",
				"payment_reminder",
				"payment_received",
				"payment_failed",

				// Chat
				"chat_message",

				// General
				"general",
				"system_update",
			],
			required: true,
			index: true,
		},

		// العنوان
		title: {
			type: String,
			required: true,
		},

		// المحتوى
		message: {
			type: String,
			required: true,
		},

		// بيانات إضافية (مرنة)
		data: {
			// معرفات مرتبطة
			shipmentId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Shipment",
			},
			exportShipmentId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "ExportShipment",
			},
			acidRequestId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "AcidRequest",
			},
			ucrRequestId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "UCRRequest",
			},
			uploadId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Upload",
			},
			invoiceId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Invoice",
			},
			chatId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Chat",
			},

			// أكواد مهمة
			acidCode: String,
			shipmentAcid: String,
			ucrNumber: String,
			invoiceNumber: String,

			// حالات
			oldStatus: String,
			newStatus: String,

			// أسباب (للرفض)
			reason: String,

			// مستندات
			documentType: String,
			documentName: String,

			// روابط
			actionUrl: String,
			imageUrl: String,

			// معلومات إضافية
			amount: Number,
			currency: String,

			// أي بيانات إضافية
			extra: mongoose.Schema.Types.Mixed,
		},

		// الأولوية
		priority: {
			type: String,
			enum: ["low", "medium", "high", "urgent"],
			default: "medium",
		},

		// حالة القراءة
		isRead: {
			type: Boolean,
			default: false,
			index: true,
		},

		// تاريخ القراءة
		readAt: {
			type: Date,
			default: null,
		},

		// تم إرسال Push Notification
		pushSent: {
			type: Boolean,
			default: false,
		},

		// تم إرسال Email
		emailSent: {
			type: Boolean,
			default: false,
		},

		// FCM Token للإرسال
		fcmToken: {
			type: String,
			default: null,
		},

		// هل تم أرشفته
		isArchived: {
			type: Boolean,
			default: false,
		},

		// تاريخ انتهاء الصلاحية (للإشعارات المؤقتة)
		expiresAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes للبحث السريع
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual للوقت المنقضي
notificationSchema.virtual("timeAgo").get(function () {
	const now = new Date();
	const diff = now - this.createdAt;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return "الآن";
	if (minutes < 60) return `منذ ${minutes} دقيقة`;
	if (hours < 24) return `منذ ${hours} ساعة`;
	if (days < 7) return `منذ ${days} يوم`;
	return this.createdAt.toLocaleDateString("ar-EG");
});

// Method لتحديد كمقروء
notificationSchema.methods.markAsRead = async function () {
	this.isRead = true;
	this.readAt = new Date();
	return this.save();
};

// Static method للحصول على إشعارات المستخدم
notificationSchema.statics.getUserNotifications = async function (
	userId,
	options = {}
) {
	const {
		page = 1,
		limit = 20,
		unreadOnly = false,
		type = null,
		priority = null,
	} = options;

	const query = { userId, isArchived: false };

	if (unreadOnly) query.isRead = false;
	if (type) query.type = type;
	if (priority) query.priority = priority;

	const notifications = await this.find(query)
		.sort({ createdAt: -1 })
		.skip((page - 1) * limit)
		.limit(limit)
		.populate("senderId", "fullname username")
		.lean();

	const total = await this.countDocuments(query);
	const unreadCount = await this.countDocuments({
		userId,
		isRead: false,
		isArchived: false,
	});

	return {
		notifications,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		unreadCount,
	};
};

// Static method لتحديد كل الإشعارات كمقروءة
notificationSchema.statics.markAllAsRead = async function (userId) {
	return this.updateMany(
		{ userId, isRead: false },
		{ isRead: true, readAt: new Date() }
	);
};

// Static method لعدد الإشعارات غير المقروءة
notificationSchema.statics.getUnreadCount = async function (userId) {
	return this.countDocuments({ userId, isRead: false, isArchived: false });
};

// Static method لحذف الإشعارات القديمة
notificationSchema.statics.deleteOldNotifications = async function (
	daysOld = 30
) {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysOld);

	return this.deleteMany({
		createdAt: { $lt: cutoffDate },
		isRead: true,
	});
};

module.exports = mongoose.model("Notification", notificationSchema);