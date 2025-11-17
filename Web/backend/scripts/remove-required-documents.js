const mongoose = require("mongoose");
const path = require("path");
const Shipment = require("../src/models/shipment");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = async () => {
	try {
		const dbUri = process.env.DATABASE_URI || process.env.MONGO_URI;
		if (!dbUri) {
			throw new Error("DATABASE_URI or MONGO_URI not found in .env file");
		}
		await mongoose.connect(dbUri);
		console.log("✅ MongoDB Connected\n");
	} catch (error) {
		console.error("❌ MongoDB Connection Error:", error);
		process.exit(1);
	}
};

const removeRequiredDocuments = async () => {
	try {
		const shipmentAcid = process.argv[2];

		if (!shipmentAcid) {
			console.log("❌ Please provide shipment ACID as argument");
			console.log("Usage: node remove-required-documents.js <ACID>");
			console.log("Example: node remove-required-documents.js ACD-2025-001");
			console.log("\nOr use --all to remove from all shipments");
			process.exit(1);
		}

		if (shipmentAcid === "--all") {
			console.log("🗑️  Removing required documents from ALL shipments...\n");

			const result = await Shipment.updateMany(
				{ "requiredDocuments.0": { $exists: true } },
				{ $set: { requiredDocuments: [] } }
			);

			console.log(
				`✅ Removed required documents from ${result.modifiedCount} shipment(s)`
			);
		} else {
			console.log(`🔍 Searching for shipment: ${shipmentAcid}\n`);

			const shipment = await Shipment.findOne({ acid: shipmentAcid });

			if (!shipment) {
				console.log(`❌ Shipment with ACID ${shipmentAcid} not found`);
				process.exit(1);
			}

			if (
				!shipment.requiredDocuments ||
				shipment.requiredDocuments.length === 0
			) {
				console.log("ℹ️  This shipment has no required documents");
				process.exit(0);
			}

			console.log(`📦 Found shipment: ${shipment.acid}`);
			console.log(
				`📋 Current required documents (${shipment.requiredDocuments.length}):`
			);
			shipment.requiredDocuments.forEach((doc, index) => {
				console.log(
					`   ${index + 1}. ${doc.name} - ${
						doc.uploaded ? "✅ Uploaded" : "⏳ Pending"
					}`
				);
			});
			console.log("");

			// Remove all required documents
			shipment.requiredDocuments = [];
			await shipment.save();

			console.log("✅ Successfully removed all required documents!");
			console.log("   The employee can now request new documents.\n");
		}
	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await mongoose.connection.close();
		console.log("🔌 Database connection closed");
	}
};

connectDB().then(removeRequiredDocuments);
