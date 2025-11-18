const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/user');
const Shipment = require('../src/models/shipment');

async function checkUserShipments() {
	try {
		// Connect to database
		await mongoose.connect(process.env.DATABASE_URI);
		console.log('✅ Connected to MongoDB');

		// Find user by email
		const email = 'Itzm7madx@gmail.com';
		let user = await User.findOne({ email: email });
		
		// If not found by email, try username
		if (!user) {
			const username = 'xiiMody';
			user = await User.findOne({ username: username });
		}

		if (!user) {
			console.log(`❌ User not found with email ${email} or username xiiMody`);
			console.log('\n📋 Available users:');
			const allUsers = await User.find({}).select('username email fullname');
			allUsers.forEach(u => {
				console.log(`  - ${u.username} (${u.email}) - ${u.fullname}`);
			});
			return;
		}

		console.log('\n📋 User Details:');
		console.log(`ID: ${user._id}`);
		console.log(`Username: ${user.username}`);
		console.log(`Full Name: ${user.fullname}`);
		console.log(`Email: ${user.email}`);

		// Find all shipments for this user
		const shipments = await Shipment.find({ client: user._id });

		console.log(`\n📦 Total Shipments: ${shipments.length}`);

		if (shipments.length > 0) {
			console.log('\n📦 Shipment Details:\n');
			shipments.forEach((shipment, index) => {
				console.log(`\n--- Shipment ${index + 1} ---`);
				console.log(`ACID: ${shipment.acid}`);
				console.log(`Status: ${shipment.status}`);
				console.log(`Client ID: ${shipment.client}`);
				console.log(`Required Documents: ${shipment.requiredDocuments?.length || 0}`);
				if (shipment.requiredDocuments?.length > 0) {
					shipment.requiredDocuments.forEach(doc => {
						console.log(`  - ${doc}`);
					});
				}
				console.log(`Created: ${shipment.createdAt}`);
			});

			// Show last 2 shipments in detail
			console.log('\n\n🔍 Last 2 Shipments (Full Data):');
			const lastTwo = shipments.slice(-2);
			console.log(JSON.stringify(lastTwo, null, 2));
		}

		await mongoose.connection.close();
		console.log('\n✅ Done!');
	} catch (error) {
		console.error('❌ Error:', error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

checkUserShipments();
