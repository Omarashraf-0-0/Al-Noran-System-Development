const mongoose = require('mongoose');
require('dotenv').config();

const Shipment = require('../src/models/shipment');

async function deleteAllShipments() {
	try {
		await mongoose.connect(process.env.DATABASE_URI);
		console.log('✅ Connected to MongoDB\n');

		const count = await Shipment.countDocuments();
		console.log(`📦 Found ${count} shipments to delete\n`);

		if (count > 0) {
			const result = await Shipment.deleteMany({});
			console.log(`✅ Deleted ${result.deletedCount} shipments successfully!`);
		} else {
			console.log('ℹ️ No shipments to delete');
		}

		await mongoose.connection.close();
		console.log('\n✅ Done!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

deleteAllShipments();
