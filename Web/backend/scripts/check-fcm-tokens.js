const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../src/models/user');

async function checkFCMTokens() {
	try {
		await mongoose.connect(process.env.DATABASE_URI);
		console.log('✅ Connected to MongoDB\n');

		const users = await User.find({}).select('username email fcmToken type');
		console.log(`📋 Total Users: ${users.length}\n`);

		let withToken = 0;
		let withoutToken = 0;

		for (const user of users) {
			const hasToken = user.fcmToken ? '✅' : '❌';
			if (user.fcmToken) withToken++;
			else withoutToken++;
			
			console.log(`${hasToken} ${user.username} (${user.type}) - FCM Token: ${user.fcmToken ? user.fcmToken.substring(0, 30) + '...' : 'NOT SET'}`);
		}

		console.log('\n' + '─'.repeat(50));
		console.log(`✅ Users WITH FCM Token: ${withToken}`);
		console.log(`❌ Users WITHOUT FCM Token: ${withoutToken}`);
		console.log('─'.repeat(50));

		await mongoose.connection.close();
		console.log('\n✅ Done!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

checkFCMTokens();
