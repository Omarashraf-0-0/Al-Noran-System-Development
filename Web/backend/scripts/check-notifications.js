const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Notification = require('../src/models/notifications');
const User = require('../src/models/user');

async function checkRecentNotifications() {
	try {
		await mongoose.connect(process.env.DATABASE_URI);
		console.log('✅ Connected to MongoDB\n');

		// Get last 20 notifications
		const notifications = await Notification.find({})
			.sort({ createdAt: -1 })
			.limit(20)
			.populate('userId', 'username email');

		console.log(`📋 Last ${notifications.length} Notifications:\n`);

		if (notifications.length === 0) {
			console.log('❌ No notifications found in database!');
		} else {
			for (const notif of notifications) {
				const user = notif.userId;
				const time = notif.createdAt.toLocaleString('ar-EG');
				console.log('─'.repeat(60));
				console.log(`📌 Type: ${notif.type}`);
				console.log(`👤 User: ${user?.username || 'Unknown'} (${user?.email || 'N/A'})`);
				console.log(`📝 Title: ${notif.title}`);
				console.log(`💬 Message: ${notif.message}`);
				console.log(`⏰ Created: ${time}`);
				console.log(`📖 Read: ${notif.isRead ? 'Yes' : 'No'}`);
				console.log(`🔔 Push Sent: ${notif.pushSent ? 'Yes' : 'No'}`);
			}
			console.log('─'.repeat(60));
		}

		// Count notifications by type
		console.log('\n📊 Notification Count by Type:');
		const types = await Notification.aggregate([
			{ $group: { _id: '$type', count: { $sum: 1 } } },
			{ $sort: { count: -1 } }
		]);
		
		for (const t of types) {
			console.log(`   ${t._id}: ${t.count}`);
		}

		await mongoose.connection.close();
		console.log('\n✅ Done!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

checkRecentNotifications();
