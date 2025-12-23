const Notification = require("../models/notifications");
const User = require("../models/user");
const { send_mail } = require("./mailer");
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Initialize Firebase Admin SDK
let firebaseInitialized = false;
const initializeFirebase = () => {
	if (firebaseInitialized) return;
	
	try {
		// Check if already initialized
		if (admin.apps.length > 0) {
			firebaseInitialized = true;
			return;
		}

		// Try to load service account file
		const serviceAccountPath = path.join(__dirname, "../config/firebase-service-account.json");
		
		if (fs.existsSync(serviceAccountPath)) {
			const serviceAccount = require(serviceAccountPath);
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
			});
			firebaseInitialized = true;
			console.log("✅ [Firebase Admin] Initialized with service account");
		} else {
			// Try with environment variable
			if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
				admin.initializeApp({
					credential: admin.credential.applicationDefault(),
				});
				firebaseInitialized = true;
				console.log("✅ [Firebase Admin] Initialized with application default credentials");
			} else {
				console.log("⚠️ [Firebase Admin] No service account found. Push notifications disabled.");
				console.log("   To enable: Add firebase-service-account.json to src/config/");
			}
		}
	} catch (error) {
		console.error("❌ [Firebase Admin] Initialization error:", error.message);
	}
};

// Initialize on module load
initializeFirebase();

/**
 * Notification Service
 * خدمة إدارة الإشعارات - إنشاء وإرسال الإشعارات للمستخدمين
 */

// =====================================================
// NOTIFICATION TEMPLATES
// =====================================================

const NOTIFICATION_TEMPLATES = {
	// ========== التسجيل والمصادقة ==========
	registration: {
		title: "مرحباً بك في النوران",
		message: "تم إنشاء حسابك بنجاح. سيتم مراجعة مستنداتك وتفعيل حسابك قريباً.",
		priority: "high",
	},
	account_activated: {
		title: "تم تفعيل حسابك",
		message: "تهانينا! تم تفعيل حسابك بنجاح. يمكنك الآن استخدام جميع خدمات التطبيق.",
		priority: "high",
	},
	password_changed: {
		title: "تم تغيير كلمة المرور",
		message: "تم تغيير كلمة المرور الخاصة بك بنجاح. إذا لم تقم بهذا التغيير، يرجى التواصل معنا فوراً.",
		priority: "high",
	},
	security_alert: {
		title: "تنبيه أمني",
		message: "تم تسجيل دخول جديد إلى حسابك. إذا لم يكن هذا أنت، يرجى تغيير كلمة المرور فوراً.",
		priority: "urgent",
	},
	otp_sent: {
		title: "رمز التحقق",
		message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
		priority: "high",
	},

	// ========== المستندات ==========
	document_uploaded: {
		title: "تم رفع المستند",
		message: "تم رفع المستند بنجاح وجاري مراجعته.",
		priority: "medium",
	},
	document_approved: {
		title: "تم قبول المستند",
		message: "تم قبول المستند الخاص بك.",
		priority: "medium",
	},
	document_rejected: {
		title: "تم رفض المستند",
		message: "تم رفض المستند. يرجى مراجعة السبب وإعادة رفع المستند.",
		priority: "high",
	},
	document_requested: {
		title: "مطلوب رفع مستند",
		message: "يرجى رفع المستند المطلوب لاستكمال الإجراءات.",
		priority: "high",
	},
	document_expiring: {
		title: "مستند يقترب من الانتهاء",
		message: "مستندك يقترب من تاريخ الانتهاء. يرجى تجديده قريباً.",
		priority: "medium",
	},

	// ========== طلبات ACID ==========
	acid_created: {
		title: "تم استلام طلب ACID",
		message: "تم استلام طلب ACID الخاص بك وجاري مراجعته.",
		priority: "medium",
	},
	acid_reviewing: {
		title: "طلب ACID قيد المراجعة",
		message: "طلب ACID الخاص بك قيد المراجعة من قبل الموظف المختص.",
		priority: "medium",
	},
	acid_issued: {
		title: "تم إصدار رقم ACID",
		message: "تم إصدار رقم ACID لطلبك.",
		priority: "high",
	},
	acid_rejected: {
		title: "تم رفض طلب ACID",
		message: "تم رفض طلب ACID. يرجى مراجعة السبب.",
		priority: "high",
	},
	acid_documents_requested: {
		title: "مستندات إضافية لطلب ACID",
		message: "مطلوب مستندات إضافية لاستكمال طلب ACID.",
		priority: "high",
	},

	// ========== الشحنات ==========
	shipment_created: {
		title: "تم إنشاء شحنة جديدة",
		message: "تم إنشاء شحنة جديدة بنجاح.",
		priority: "medium",
	},
	shipment_status_changed: {
		title: "تحديث حالة الشحنة",
		message: "تم تحديث حالة شحنتك.",
		priority: "medium",
	},
	shipment_arrived: {
		title: "وصلت شحنتك",
		message: "شحنتك وصلت إلى الميناء.",
		priority: "high",
	},
	shipment_completed: {
		title: "تمت الشحنة بنجاح",
		message: "تمت جميع إجراءات الشحنة بنجاح.",
		priority: "high",
	},
	shipment_documents_requested: {
		title: "مستندات مطلوبة للشحنة",
		message: "يرجى رفع المستندات المطلوبة لشحنتك.",
		priority: "high",
	},

	// ========== طلبات التصدير UCR ==========
	ucr_created: {
		title: "تم استلام طلب التصدير",
		message: "تم استلام طلب التصدير الخاص بك.",
		priority: "medium",
	},
	ucr_reviewing: {
		title: "طلب التصدير قيد المراجعة",
		message: "طلب التصدير الخاص بك قيد المراجعة.",
		priority: "medium",
	},
	ucr_approved: {
		title: "تم قبول طلب التصدير",
		message: "تم قبول طلب التصدير الخاص بك.",
		priority: "high",
	},
	ucr_rejected: {
		title: "تم رفض طلب التصدير",
		message: "تم رفض طلب التصدير. يرجى مراجعة السبب.",
		priority: "high",
	},
	ucr_certificate_issued: {
		title: "تم إصدار شهادة المنشأ",
		message: "تم إصدار شهادة المنشأ لطلب التصدير.",
		priority: "high",
	},
	ucr_documents_requested: {
		title: "مستندات إضافية للتصدير",
		message: "مطلوب مستندات إضافية لطلب التصدير.",
		priority: "high",
	},

	// ========== المالية ==========
	invoice_created: {
		title: "فاتورة جديدة",
		message: "تم إنشاء فاتورة جديدة لحسابك.",
		priority: "medium",
	},
	payment_reminder: {
		title: "تذكير بموعد الدفع",
		message: "لديك فاتورة مستحقة الدفع.",
		priority: "high",
	},
	payment_received: {
		title: "تم استلام الدفع",
		message: "تم استلام المبلغ بنجاح. شكراً لك.",
		priority: "medium",
	},
	payment_failed: {
		title: "فشل في الدفع",
		message: "فشلت عملية الدفع. يرجى المحاولة مرة أخرى.",
		priority: "high",
	},

	// ========== المحادثات ==========
	chat_message: {
		title: "رسالة جديدة",
		message: "لديك رسالة جديدة من فريق الدعم.",
		priority: "medium",
	},

	// ========== عام ==========
	general: {
		title: "إشعار",
		message: "",
		priority: "low",
	},
	system_update: {
		title: "تحديث النظام",
		message: "تم تحديث النظام بميزات جديدة.",
		priority: "low",
	},
};

// =====================================================
// EMAIL TEMPLATES
// =====================================================

const generateEmailHTML = (notification) => {
	const priorityColors = {
		low: "#1ba3b6",
		medium: "#1ba3b6",
		high: "#f59e0b",
		urgent: "#dc2626",
	};

	const priorityColor = priorityColors[notification.priority] || "#1ba3b6";

	return `
	<!DOCTYPE html>
	<html dir="rtl" lang="ar">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>${notification.title}</title>
	</head>
	<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
		<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px;">
			<tr>
				<td align="center">
					<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
						<!-- Header -->
						<tr>
							<td style="background:linear-gradient(135deg,#690000,#8B0000);padding:30px;text-align:center;">
								<img src="https://your-domain.com/logo.png" alt="النوران" style="width:80px;height:80px;border-radius:16px;background:#fff;padding:10px;margin-bottom:15px;">
								<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">النوران لخدمات الشحن</h1>
							</td>
						</tr>
						
						<!-- Content -->
						<tr>
							<td style="padding:40px 30px;">
								<div style="border-right:4px solid ${priorityColor};padding-right:20px;margin-bottom:25px;">
									<h2 style="color:#333;margin:0 0 10px 0;font-size:22px;">${notification.title}</h2>
									<p style="color:#666;margin:0;font-size:16px;line-height:1.6;">${notification.message}</p>
								</div>
								
								${notification.data?.actionUrl ? `
								<div style="text-align:center;margin-top:30px;">
									<a href="${notification.data.actionUrl}" style="display:inline-block;background:linear-gradient(135deg,#690000,#8B0000);color:#ffffff;padding:14px 40px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;">
										عرض التفاصيل
									</a>
								</div>
								` : ''}
								
								${notification.data?.reason ? `
								<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:15px;margin-top:20px;">
									<p style="color:#991b1b;margin:0;font-size:14px;"><strong>السبب:</strong> ${notification.data.reason}</p>
								</div>
								` : ''}
							</td>
						</tr>
						
						<!-- Footer -->
						<tr>
							<td style="background:#f9fafb;padding:25px 30px;text-align:center;border-top:1px solid #e5e7eb;">
								<p style="color:#6b7280;margin:0 0 10px 0;font-size:14px;">
									هذه رسالة آلية من نظام النوران - يرجى عدم الرد عليها مباشرة
								</p>
								<p style="color:#9ca3af;margin:0;font-size:12px;">
									© ${new Date().getFullYear()} النوران لخدمات الشحن - جميع الحقوق محفوظة
								</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
	</html>
	`;
};

// =====================================================
// MAIN SERVICE FUNCTIONS
// =====================================================

/**
 * إنشاء وإرسال إشعار جديد
 * @param {Object} options - خيارات الإشعار
 * @param {string} options.userId - معرف المستخدم المستلم
 * @param {string} options.type - نوع الإشعار
 * @param {string} [options.title] - العنوان (اختياري - يستخدم القالب)
 * @param {string} [options.message] - الرسالة (اختياري - يستخدم القالب)
 * @param {Object} [options.data] - بيانات إضافية
 * @param {string} [options.priority] - الأولوية
 * @param {boolean} [options.sendEmail=false] - إرسال بريد إلكتروني
 * @param {boolean} [options.sendPush=false] - إرسال push notification
 * @param {string} [options.senderId] - معرف المرسل (اختياري)
 */
const createNotification = async (options) => {
	try {
		const {
			userId,
			type,
			title,
			message,
			data = {},
			priority,
			sendEmail = false,
			sendPush = false,
			senderId = null,
		} = options;

		// التحقق من البيانات المطلوبة
		if (!userId || !type) {
			throw new Error("userId and type are required");
		}

		// الحصول على القالب
		const template = NOTIFICATION_TEMPLATES[type] || NOTIFICATION_TEMPLATES.general;

		// إنشاء الإشعار
		const notification = new Notification({
			userId,
			senderId,
			type,
			title: title || template.title,
			message: message || template.message,
			data,
			priority: priority || template.priority,
		});

		await notification.save();
		console.log(`📬 [NotificationService] Created notification: ${type} for user: ${userId}`);

		// إرسال الإشعار عبر Socket.IO للمستخدمين المتصلين
		if (global.io && global.userSockets) {
			try {
				const userSocketIds = global.userSockets.get(userId.toString());
				if (userSocketIds && userSocketIds.size > 0) {
					// إرسال الإشعار لجميع الجلسات النشطة للمستخدم
					userSocketIds.forEach(socketId => {
						global.io.to(socketId).emit('new_notification', {
							notification: notification.toObject(),
							unreadCount: notification.isRead ? undefined : 1 // سيتم تحديثه من الفرونت إند
						});
					});
					console.log(`🔔 [NotificationService] Notification sent via Socket.IO to user: ${userId}`);
				} else {
					console.log(`⚠️ [NotificationService] User ${userId} is not currently connected via Socket.IO`);
				}
			} catch (socketError) {
				console.error("❌ [NotificationService] Socket.IO error:", socketError.message);
			}
		}

		// إرسال البريد الإلكتروني إذا مطلوب
		if (sendEmail) {
			try {
				const user = await User.findById(userId);
				if (user && user.email) {
					const emailHTML = generateEmailHTML(notification);
					await send_mail(
						user.email,
						notification.title,
						notification.message,
						emailHTML
					);
					notification.emailSent = true;
					await notification.save();
					console.log(`📧 [NotificationService] Email sent to: ${user.email}`);
				}
			} catch (emailError) {
				console.error("❌ [NotificationService] Email error:", emailError.message);
			}
		}

		// إرسال Push Notification إذا مطلوب
		if (sendPush) {
			console.log(`🔔 [NotificationService] sendPush is TRUE, checking user FCM token...`);
			try {
				const user = await User.findById(userId);
				console.log(`🔔 [NotificationService] User found: ${user ? user.name : 'NOT FOUND'}`);
				console.log(`🔔 [NotificationService] User FCM Token: ${user?.fcmToken ? 'EXISTS (' + user.fcmToken.substring(0, 20) + '...)' : 'NOT SET'}`);
				if (user && user.fcmToken) {
					await sendPushNotification(user.fcmToken, notification);
					notification.pushSent = true;
					await notification.save();
					console.log(`🔔 [NotificationService] Push sent to user: ${userId}`);
				} else {
					console.log(`⚠️ [NotificationService] No FCM token for user: ${userId}`);
				}
			} catch (pushError) {
				console.error("❌ [NotificationService] Push error:", pushError.message);
			}
		} else {
			console.log(`🔔 [NotificationService] sendPush is FALSE, skipping push notification`);
		}

		return notification;
	} catch (error) {
		console.error("❌ [NotificationService] Error creating notification:", error);
		throw error;
	}
};

/**
 * إنشاء إشعارات متعددة (لعدة مستخدمين)
 */
const createBulkNotifications = async (userIds, notificationData) => {
	const notifications = [];

	for (const userId of userIds) {
		try {
			const notification = await createNotification({
				...notificationData,
				userId,
			});
			notifications.push(notification);
		} catch (error) {
			console.error(`❌ Failed to create notification for user ${userId}:`, error.message);
		}
	}

	return notifications;
};

/**
 * إرسال Push Notification (FCM)
 */
const sendPushNotification = async (fcmToken, notification) => {
	try {
		if (!fcmToken) {
			console.log("⚠️ [FCM] No FCM token provided");
			return false;
		}

		if (!firebaseInitialized || admin.apps.length === 0) {
			console.log("⚠️ [FCM] Firebase Admin not initialized, skipping push");
			return false;
		}

		const message = {
			notification: {
				title: notification.title,
				body: notification.message,
			},
			data: {
				type: notification.type || "general",
				notificationId: notification._id ? notification._id.toString() : "",
				priority: notification.priority || "medium",
				click_action: "FLUTTER_NOTIFICATION_CLICK",
			},
			android: {
				priority: "high",
				notification: {
					sound: "default",
					channelId: "alnoran_notifications",
				},
			},
			apns: {
				payload: {
					aps: {
						sound: "default",
						badge: 1,
					},
				},
			},
			token: fcmToken,
		};

		const response = await admin.messaging().send(message);
		console.log(`✅ [FCM] Push notification sent successfully: ${response}`);
		return true;
	} catch (error) {
		console.error(`❌ [FCM] Error sending push notification:`, error.message);
		
		// Handle invalid token
		if (error.code === "messaging/invalid-registration-token" ||
			error.code === "messaging/registration-token-not-registered") {
			console.log("⚠️ [FCM] Invalid token, should remove from user");
		}
		
		return false;
	}
};

/**
 * الحصول على إشعارات المستخدم
 */
const getUserNotifications = async (userId, options = {}) => {
	return Notification.getUserNotifications(userId, options);
};

/**
 * تحديد إشعار كمقروء
 */
const markAsRead = async (notificationId, userId) => {
	const notification = await Notification.findOneAndUpdate(
		{ _id: notificationId, userId },
		{ isRead: true, readAt: new Date() },
		{ new: true }
	);
	return notification;
};

/**
 * تحديد كل الإشعارات كمقروءة
 */
const markAllAsRead = async (userId) => {
	return Notification.markAllAsRead(userId);
};

/**
 * الحصول على عدد الإشعارات غير المقروءة
 */
const getUnreadCount = async (userId) => {
	return Notification.getUnreadCount(userId);
};

/**
 * حذف إشعار
 */
const deleteNotification = async (notificationId, userId) => {
	return Notification.findOneAndDelete({ _id: notificationId, userId });
};

/**
 * أرشفة إشعار
 */
const archiveNotification = async (notificationId, userId) => {
	return Notification.findOneAndUpdate(
		{ _id: notificationId, userId },
		{ isArchived: true },
		{ new: true }
	);
};

// =====================================================
// SPECIFIC NOTIFICATION HELPERS
// =====================================================

/**
 * إشعار تسجيل جديد
 */
const notifyRegistration = async (userId, clientType) => {
	return createNotification({
		userId,
		type: "registration",
		message: `تم إنشاء حسابك من نوع ${clientType === 'personal' ? 'شخصي' : clientType === 'commercial' ? 'تجاري' : 'مصنع'} بنجاح. سيتم مراجعة مستنداتك وتفعيل حسابك قريباً.`,
		sendEmail: true,
		sendPush: true,
		priority: "high",
	});
};

/**
 * إشعار تفعيل الحساب
 */
const notifyAccountActivated = async (userId) => {
	return createNotification({
		userId,
		type: "account_activated",
		sendEmail: true,
		sendPush: true,
		priority: "high",
	});
};

/**
 * إشعار قبول/رفض مستند
 */
const notifyDocumentStatus = async (userId, documentType, status, reason = null) => {
	const type = status === "approved" ? "document_approved" : "document_rejected";
	const documentNames = {
		personal_id: "البطاقة الشخصية",
		power_of_attorney: "التوكيل",
		contract: "العقد",
		tax_card: "البطاقة الضريبية",
		commercial_register: "السجل التجاري",
		certificate_vat: "شهادة القيمة المضافة",
		import_export_card: "بطاقة الاستيراد/التصدير",
		industrial_register: "السجل الصناعي",
		production_supplies: "مستلزمات الإنتاج",
	};

	const docName = documentNames[documentType] || documentType;

	return createNotification({
		userId,
		type,
		message: status === "approved" 
			? `تم قبول ${docName} بنجاح.`
			: `تم رفض ${docName}. ${reason ? `السبب: ${reason}` : 'يرجى إعادة رفع المستند.'}`,
		data: { documentType, documentName: docName, reason },
		sendEmail: status === "rejected",
		sendPush: true,
		priority: status === "rejected" ? "high" : "medium",
	});
};

/**
 * إشعار إصدار ACID
 */
const notifyAcidIssued = async (userId, acidCode, acidRequestId) => {
	return createNotification({
		userId,
		type: "acid_issued",
		message: `تم إصدار رقم ACID: ${acidCode}`,
		data: { acidCode, acidRequestId },
		sendEmail: true,
		sendPush: true,
		priority: "high",
	});
};

/**
 * إشعار تغيير حالة الشحنة
 */
const notifyShipmentStatusChange = async (userId, shipmentId, shipmentAcid, oldStatus, newStatus) => {
	const statusMessages = {
		"Pending": "قيد الانتظار",
		"في انتظار الشحن": "في انتظار الشحن",
		"في الطريق": "في الطريق",
		"تم وصول البضاعة": "تم وصول البضاعة",
		"في انتظار وصول الإذن": "في انتظار وصول الإذن",
		"التخليص الجمركى": "التخليص الجمركي",
		"جارى الكشف و التثمين": "جاري الكشف والتثمين",
		"مكتملة": "مكتملة",
		"تمت بنجاح": "تمت بنجاح",
	};

	const newStatusAr = statusMessages[newStatus] || newStatus;
	const isCompleted = newStatus === "تمت بنجاح" || newStatus === "مكتملة";
	const isArrived = newStatus === "تم وصول البضاعة";

	return createNotification({
		userId,
		type: isCompleted ? "shipment_completed" : isArrived ? "shipment_arrived" : "shipment_status_changed",
		message: `تم تحديث حالة الشحنة ${shipmentAcid} إلى: ${newStatusAr}`,
		data: { shipmentId, shipmentAcid, oldStatus, newStatus },
		sendEmail: isCompleted || isArrived,
		sendPush: true,
		priority: isCompleted || isArrived ? "high" : "medium",
	});
};

/**
 * إشعار طلب مستندات للشحنة
 */
const notifyShipmentDocumentsRequested = async (userId, shipmentId, shipmentAcid, documents) => {
	const docList = documents.map(d => d.name || d).join("، ");
	
	return createNotification({
		userId,
		type: "shipment_documents_requested",
		message: `مطلوب رفع المستندات التالية لشحنتك ${shipmentAcid}: ${docList}`,
		data: { shipmentId, shipmentAcid, documents },
		sendEmail: true,
		sendPush: true,
		priority: "high",
	});
};

/**
 * إشعار UCR
 */
const notifyUCRStatus = async (userId, ucrRequestId, ucrNumber, status, reason = null) => {
	const types = {
		created: "ucr_created",
		reviewing: "ucr_reviewing",
		approved: "ucr_approved",
		rejected: "ucr_rejected",
		certificate_issued: "ucr_certificate_issued",
	};

	const messages = {
		created: `تم استلام طلب التصدير رقم ${ucrNumber}`,
		reviewing: `طلب التصدير رقم ${ucrNumber} قيد المراجعة`,
		approved: `تم قبول طلب التصدير رقم ${ucrNumber}`,
		rejected: `تم رفض طلب التصدير رقم ${ucrNumber}. ${reason ? `السبب: ${reason}` : ''}`,
		certificate_issued: `تم إصدار شهادة المنشأ لطلب التصدير رقم ${ucrNumber}`,
	};

	return createNotification({
		userId,
		type: types[status] || "ucr_created",
		message: messages[status],
		data: { ucrRequestId, ucrNumber, reason },
		sendEmail: status === "rejected" || status === "certificate_issued",
		sendPush: true,
		priority: status === "rejected" || status === "certificate_issued" ? "high" : "medium",
	});
};

/**
 * إشعار رسالة شات جديدة
 */
const notifyChatMessage = async (userId, chatId, senderName) => {
	return createNotification({
		userId,
		type: "chat_message",
		message: `لديك رسالة جديدة من ${senderName}`,
		data: { chatId },
		sendPush: true,
		priority: "medium",
	});
};

/**
 * الحصول على إشعارات الموظف حسب المعرف
 */
const getEmployeeNotificationsById = async (employeeId) => {
	try {
		if (!employeeId) {
			throw new Error("employeeId is required");
		}

		const notifications = await Notification.find({ userId: employeeId })
			.sort({ createdAt: -1 }); // latest first

		console.log(`📬 [NotificationService] Fetched ${notifications.length} notifications for employee: ${employeeId}`);

		// ✅ ALWAYS return array
		return notifications;

	} catch (error) {
		console.error(
			"❌ [NotificationService] Error fetching notifications:",
			error.message
		);
		throw error;
	}
};

/**
 * إشعار إيصال دفع جديد
 */
const notifyPaymentReceiptUploaded = async (userId, paymentId) => {
	return createNotification({
		userId,
		type: "payment_received",
		title: "تم استلام إيصال الدفع",
		message: "تم استلام إيصال الدفع الخاص بك وجاري مراجعته",
		data: { paymentId },
		sendPush: true,
		priority: "medium",
	});
};

/**
 * إشعار قبول/رفض إيصال الدفع
 */
const notifyPaymentStatus = async (userId, paymentId, status, amount = null) => {
	const isApproved = status === "APPROVED";
	const isRejected = status === "REJECTED";
	
	let message;
	let type;
	
	if (isApproved) {
		type = "payment_received";
		message = amount 
			? `تم قبول إيصال الدفع بقيمة ${amount} ج.م`
			: "تم قبول إيصال الدفع الخاص بك";
	} else if (isRejected) {
		type = "payment_failed";
		message = "تم رفض إيصال الدفع. يرجى التواصل مع الدعم للمزيد من المعلومات.";
	} else {
		type = "payment_reminder";
		message = "إيصال الدفع الخاص بك قيد المراجعة";
	}

	return createNotification({
		userId,
		type,
		message,
		data: { paymentId, status, amount },
		sendEmail: isApproved || isRejected,
		sendPush: true,
		priority: isRejected ? "high" : "medium",
	});
};

/**
 * إشعار فاتورة جديدة
 */
const notifyInvoiceCreated = async (userId, invoiceId, invoiceNumber, total) => {
	return createNotification({
		userId,
		type: "invoice_created",
		title: "فاتورة جديدة",
		message: `تم إنشاء فاتورة جديدة رقم ${invoiceNumber} بقيمة ${total} ج.م`,
		data: { invoiceId, invoiceNumber, total },
		sendEmail: true,
		sendPush: true,
		priority: "medium",
	});
};

/**
 * إشعار دفع فاتورة بنجاح
 */
const notifyInvoicePaid = async (userId, invoiceId, invoiceNumber) => {
	return createNotification({
		userId,
		type: "invoice_paid",
		title: "تم سداد الفاتورة",
		message: `تم سداد الفاتورة رقم ${invoiceNumber} بنجاح. شكراً لك.`,
		data: { invoiceId, invoiceNumber },
		sendEmail: true,
		sendPush: true,
		priority: "medium",
	});
};

/**
 * إشعار تذكير بموعد الدفع
 */
const notifyPaymentReminder = async (userId, invoiceId, invoiceNumber, dueAmount) => {
	return createNotification({
		userId,
		type: "payment_reminder",
		title: "تذكير بموعد الدفع",
		message: `لديك فاتورة مستحقة الدفع رقم ${invoiceNumber} بقيمة ${dueAmount} ج.م`,
		data: { invoiceId, invoiceNumber, dueAmount },
		sendEmail: true,
		sendPush: true,
		priority: "high",
	});
};

/**
 * إشعار تغيير حالة شحنة التصدير
 */
const notifyExportShipmentStatusChange = async (userId, shipmentId, exportNumber, oldStatus, newStatus) => {
	const statusMessages = {
		"documents_verification": "التحقق من المستندات",
		"regulatory_inspection": "الفحص التنظيمي",
		"payment_cleared": "تم تسوية المدفوعات",
		"goods_loaded": "تم تحميل البضائع",
		"in_transit": "في الطريق",
		"delivered": "تم التسليم",
		"completed": "مكتملة",
		"cancelled": "ملغية",
	};

	const newStatusAr = statusMessages[newStatus] || newStatus;
	const isCompleted = newStatus === "completed" || newStatus === "delivered";
	const isDelivered = newStatus === "delivered";
	const isCancelled = newStatus === "cancelled";

	return createNotification({
		userId,
		type: isCompleted ? "export_shipment_completed" : isCancelled ? "export_shipment_cancelled" : "export_shipment_status_changed",
		message: `تم تحديث حالة شحنة التصدير ${exportNumber} إلى: ${newStatusAr}`,
		data: { shipmentId, exportNumber, oldStatus, newStatus },
		sendEmail: isCompleted || isCancelled,
		sendPush: true,
		priority: isCompleted || isDelivered || isCancelled ? "high" : "medium",
	});
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
	// Main functions
	createNotification,
	createBulkNotifications,
	getUserNotifications,
	markAsRead,
	markAllAsRead,
	getUnreadCount,
	deleteNotification,
	archiveNotification,
	
	// Specific helpers
	notifyRegistration,
	notifyAccountActivated,
	notifyDocumentStatus,
	notifyAcidIssued,
	notifyShipmentStatusChange,
	notifyShipmentDocumentsRequested,
	notifyUCRStatus,
	notifyChatMessage,
	getEmployeeNotificationsById,
	notifyPaymentReceiptUploaded,
	notifyPaymentStatus,
	notifyInvoiceCreated,
	notifyInvoicePaid,
	notifyPaymentReminder,
	notifyExportShipmentStatusChange,
	
	// Templates (for reference)
	NOTIFICATION_TEMPLATES,
};
