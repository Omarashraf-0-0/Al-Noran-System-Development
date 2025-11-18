const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/user');
const Shipment = require('../src/models/shipment');

async function listAllUsers() {
	try {
		await mongoose.connect(process.env.DATABASE_URI);
		console.log('✅ Connected to MongoDB\n');

		const users = await User.find({});
		console.log(`📋 Total Users: ${users.length}\n`);

		if (users.length === 0) {
			console.log('❌ No users found in database!');
		} else {
			for (const user of users) {
				console.log('─'.repeat(50));
				console.log(`Username: ${user.username}`);
				console.log(`Email: ${user.email}`);
				console.log(`Full Name: ${user.fullname || 'N/A'}`);
				console.log(`ID: ${user._id}`);
				
				// Count shipments
				const shipmentCount = await Shipment.countDocuments({ client: user._id });
				console.log(`Shipments: ${shipmentCount}`);
			}
			console.log('─'.repeat(50));
		}

		await mongoose.connection.close();
		console.log('\n✅ Done!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

listAllUsers();
