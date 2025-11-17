const mongoose = require("mongoose");
const Upload = require("../src/models/upload");
const Shipment = require("../src/models/shipment");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
	try {
		const dbUri = process.env.DATABASE_URI || process.env.MONGO_URI;
		if (!dbUri) {
			throw new Error("DATABASE_URI or MONGO_URI not found in .env file");
		}
		await mongoose.connect(dbUri);
		console.log("✅ MongoDB Connected");
	} catch (error) {
		console.error("❌ MongoDB Connection Error:", error);
		process.exit(1);
	}
};

const cleanTestUploads = async () => {
	try {
		console.log("🧹 Starting cleanup...\n");

		// Get the shipment ACID to clean (you can modify this)
		const shipmentAcid = process.argv[2];

		if (!shipmentAcid) {
			console.log("❌ Please provide shipment ACID as argument");
			console.log("Usage: node clean-test-uploads.js <ACID>");
			console.log("Example: node clean-test-uploads.js ACID123");
			process.exit(1);
		}

		// Find shipment by ACID
		const shipment = await Shipment.findOne({ acid: shipmentAcid });

		if (!shipment) {
			console.log(`❌ Shipment with ACID ${shipmentAcid} not found`);
			process.exit(1);
		}

		console.log(`📦 Found shipment: ${shipment.acid}`);
		console.log(`🆔 Shipment ID: ${shipment._id}\n`);

		// 1. Delete uploads related to this shipment
		const uploadsResult = await Upload.deleteMany({
			category: "shipment",
			relatedId: shipment._id.toString(),
		});
		console.log(
			`🗑️  Deleted ${uploadsResult.deletedCount} upload(s) from database`
		);

		// 2. Reset required documents in shipment
		if (shipment.requiredDocuments && shipment.requiredDocuments.length > 0) {
			console.log(
				`📋 Found ${shipment.requiredDocuments.length} required documents`
			);

			// Reset all required documents to not uploaded
			shipment.requiredDocuments = shipment.requiredDocuments.map((doc) => ({
				...doc.toObject(),
				uploaded: false,
				fileId: null,
				uploadedAt: null,
			}));

			await shipment.save();
			console.log('✅ Reset all required documents to "not uploaded" state');
		} else {
			console.log("ℹ️  No required documents found");
		}

		console.log("\n✅ Cleanup completed successfully!");
		console.log("You can now test the upload process again.");
	} catch (error) {
		console.error("❌ Error during cleanup:", error);
	} finally {
		await mongoose.connection.close();
		console.log("\n🔌 Database connection closed");
	}
};

// Option 2: Delete ALL test uploads (use with caution)
const cleanAllTestUploads = async () => {
	try {
		console.log("🧹 Cleaning ALL test uploads...\n");

		// Delete all shipment uploads with documentType 'other'
		const uploadsResult = await Upload.deleteMany({
			category: "shipment",
			documentType: "other",
		});
		console.log(`🗑️  Deleted ${uploadsResult.deletedCount} test upload(s)`);

		// Reset all required documents in all shipments
		const shipments = await Shipment.find({
			"requiredDocuments.0": { $exists: true },
		});
		console.log(
			`📦 Found ${shipments.length} shipment(s) with required documents`
		);

		let resetCount = 0;
		for (const shipment of shipments) {
			shipment.requiredDocuments = shipment.requiredDocuments.map((doc) => ({
				...doc.toObject(),
				uploaded: false,
				fileId: null,
				uploadedAt: null,
			}));
			await shipment.save();
			resetCount++;
		}

		console.log(`✅ Reset required documents in ${resetCount} shipment(s)`);
		console.log("\n✅ Cleanup completed!");
	} catch (error) {
		console.error("❌ Error during cleanup:", error);
	} finally {
		await mongoose.connection.close();
		console.log("\n🔌 Database connection closed");
	}
};

// Run the script
connectDB().then(() => {
	const mode = process.argv[2];

	if (mode === "--all") {
		console.log("⚠️  WARNING: This will delete ALL test uploads!\n");
		cleanAllTestUploads();
	} else {
		cleanTestUploads();
	}
});
