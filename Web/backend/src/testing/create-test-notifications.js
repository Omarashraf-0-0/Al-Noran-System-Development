/**
 * Test Script to Create Sample Notifications
 * Run this from Web/backend directory:
 * node src/testing/create-test-notifications.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Notification = require("../models/notifications");

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/alnoran";

async function createTestNotifications() {
	try {
		console.log("🔌 Connecting to MongoDB...");
		await mongoose.connect(MONGO_URI);
		console.log("✅ Connected to MongoDB");

		// Get a user ID from your database
		// Replace this with an actual user ID from your database
		const userId = "YOUR_USER_ID_HERE"; // <<< CHANGE THIS

		console.log("\n📝 Creating test notifications...");

		// Sample notifications
		const sampleNotifications = [
			{
				userId,
				type: "shipment_created",
				title: "شحنة جديدة",
				message: "تم إنشاء شحنة جديدة برقم AIR-001",
				priority: "high",
				read: false,
			},
			{
				userId,
				type: "document_uploaded",
				title: "مستند جديد",
				message: "تم رفع فاتورة مبدئية للشحنة AIR-001",
				priority: "medium",
				read: false,
			},
			{
				userId,
				type: "shipment_status_changed",
				title: "تحديث حالة الشحنة",
				message: "تم تحديث حالة الشحنة AIR-001 إلى 'في الطريق'",
				priority: "medium",
				read: false,
			},
			{
				userId,
				type: "payment_reminder",
				title: "تذكير بالدفع",
				message: "لديك فاتورة مستحقة بقيمة 5000 جنيه",
				priority: "urgent",
				read: false,
			},
			{
				userId,
				type: "document_approved",
				title: "تمت الموافقة على المستند",
				message: "تم قبول فاتورة الشحنة AIR-001",
				priority: "low",
				read: false,
			},
			{
				userId,
				type: "chat_message",
				title: "رسالة جديدة",
				message: "لديك رسالة جديدة من فريق الدعم",
				priority: "medium",
				read: false,
			},
		];

		// Create notifications
		for (const notif of sampleNotifications) {
			const created = await Notification.create(notif);
			console.log(`✅ Created: ${created.title} (${created.type})`);
		}

		console.log("\n🎉 Successfully created test notifications!");
		console.log(`📊 Total: ${sampleNotifications.length} notifications`);
		
		// Show unread count
		const unreadCount = await Notification.countDocuments({
			userId,
			read: false,
		});
		console.log(`📬 Unread notifications: ${unreadCount}`);

	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await mongoose.connection.close();
		console.log("\n🔌 Disconnected from MongoDB");
		process.exit(0);
	}
}

// Run the script
createTestNotifications();
