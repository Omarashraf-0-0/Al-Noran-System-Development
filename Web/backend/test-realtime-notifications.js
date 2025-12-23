/**
 * Test Script for Real-Time Notification System
 * 
 * This script helps test the new Socket.IO-based notification system
 * Run this after starting the backend server to send test notifications
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3500';
const TEST_USER_ID = 'YOUR_USER_ID_HERE'; // Replace with actual user ID from MongoDB
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with valid JWT token

// Test notification data
const testNotifications = [
	{
		type: 'general',
		title: '🎉 اختبار الإشعارات الفورية',
		message: 'هذا إشعار تجريبي يجب أن يصل فوراً عبر Socket.IO!',
		priority: 'high',
	},
	{
		type: 'shipment_created',
		title: '📦 شحنة جديدة',
		message: 'تم إنشاء شحنة رقم AIR-12345',
		priority: 'high',
	},
	{
		type: 'payment_received',
		title: '✅ تم استلام الدفعة',
		message: 'تم استلام دفعة بقيمة 1000 ريال',
		priority: 'medium',
	},
	{
		type: 'document_uploaded',
		title: '📄 مستند جديد',
		message: 'تم رفع مستند جديد لمراجعته',
		priority: 'medium',
	},
];

/**
 * Send a test notification
 */
async function sendTestNotification(notificationData) {
	try {
		console.log('\n📤 Sending notification:', notificationData.title);
		
		const response = await axios.post(
			`${API_URL}/api/notifications/send`,
			{
				userId: TEST_USER_ID,
				...notificationData,
			},
			{
				headers: {
					'Authorization': `Bearer ${AUTH_TOKEN}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (response.data.success) {
			console.log('✅ Notification sent successfully!');
			console.log('   Notification ID:', response.data.notification?._id);
			return true;
		} else {
			console.log('❌ Failed to send notification:', response.data.message);
			return false;
		}
	} catch (error) {
		console.error('❌ Error sending notification:', error.response?.data?.message || error.message);
		return false;
	}
}

/**
 * Send all test notifications with delay
 */
async function sendAllTestNotifications() {
	console.log('🚀 Starting Real-Time Notification Test...');
	console.log('   API URL:', API_URL);
	console.log('   Target User ID:', TEST_USER_ID);
	console.log('\n⚠️  Make sure:');
	console.log('   1. Backend server is running');
	console.log('   2. Frontend is open and user is logged in');
	console.log('   3. Browser console shows: "Socket connected for notifications"');
	console.log('\n' + '='.repeat(60));

	for (let i = 0; i < testNotifications.length; i++) {
		await sendTestNotification(testNotifications[i]);
		
		// Wait 2 seconds between notifications
		if (i < testNotifications.length - 1) {
			console.log('   ⏳ Waiting 2 seconds...');
			await new Promise(resolve => setTimeout(resolve, 2000));
		}
	}

	console.log('\n' + '='.repeat(60));
	console.log('✨ Test completed!');
	console.log('\n📋 Check your frontend:');
	console.log('   - Notifications should appear instantly');
	console.log('   - Toast messages should show');
	console.log('   - Unread count should update');
	console.log('   - No database polling should occur (check Network tab)');
}

/**
 * Send a single custom notification
 */
async function sendCustomNotification(type, title, message, priority = 'medium') {
	await sendTestNotification({ type, title, message, priority });
}

// Main execution
if (require.main === module) {
	// Check if user ID and token are set
	if (TEST_USER_ID === 'YOUR_USER_ID_HERE' || AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
		console.error('\n❌ Configuration Error!');
		console.error('\nPlease update the following constants in this file:');
		console.error('   - TEST_USER_ID: Your MongoDB user ID');
		console.error('   - AUTH_TOKEN: Valid JWT token from login');
		console.error('\nTo get your user ID and token:');
		console.error('   1. Open your browser');
		console.error('   2. Login to the application');
		console.error('   3. Open DevTools Console');
		console.error('   4. Run: localStorage.getItem("user") - Copy the _id field');
		console.error('   5. Run: localStorage.getItem("token") - Copy the entire token');
		process.exit(1);
	}

	// Run the test
	sendAllTestNotifications()
		.then(() => process.exit(0))
		.catch(error => {
			console.error('\n💥 Test failed:', error.message);
			process.exit(1);
		});
}

module.exports = {
	sendTestNotification,
	sendCustomNotification,
	sendAllTestNotifications,
};
