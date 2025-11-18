const mongoose = require('mongoose');
require('dotenv').config();

const Shipment = require('../src/models/shipment');
const User = require('../src/models/user');

async function listAllShipments() {
	try {
		await mongoose.connect(process.env.DATABASE_URI);
		console.log('✅ Connected to MongoDB\n');

		const shipments = await Shipment.find({}).populate('user_id', 'username email fullname');
		console.log(`📦 Total Shipments: ${shipments.length}\n`);

		if (shipments.length === 0) {
			console.log('❌ No shipments found in database!');
		} else {
			for (const shipment of shipments) {
				console.log('─'.repeat(70));
				console.log(`ACID: ${shipment.acid}`);
				console.log(`Status: ${shipment.status}`);
				console.log(`Client: ${shipment.user_id?.username || 'N/A'} (${shipment.user_id?.email || 'N/A'})`);
				console.log(`Full Name: ${shipment.user_id?.fullname || 'N/A'}`);
				console.log(`Required Docs: ${shipment.requiredDocuments?.length || 0}`);
				if (shipment.requiredDocuments?.length > 0) {
					shipment.requiredDocuments.forEach(doc => {
						console.log(`  - ${doc}`);
					});
				}
				console.log(`Created: ${shipment.createdAt}`);
			}
			console.log('─'.repeat(70));
			
			// Show last 2 in full detail
			console.log('\n\n🔍 Last 2 Shipments (Full JSON):\n');
			const lastTwo = shipments.slice(-2);
			console.log(JSON.stringify(lastTwo, null, 2));
		}

		await mongoose.connection.close();
		console.log('\n✅ Done!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

listAllShipments();
