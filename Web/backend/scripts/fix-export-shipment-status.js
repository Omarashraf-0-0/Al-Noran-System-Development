/**
 * Migration Script: Fix Export Shipment Status Values
 * 
 * This script updates any ExportShipment documents that have invalid status values
 * to use the correct "documents_verification" default status.
 * 
 * Run with: node scripts/fix-export-shipment-status.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Valid status values from the ExportShipment model
const VALID_STATUSES = [
	"documents_verification",
	"regulatory_inspection",
	"payment_cleared",
	"goods_loaded",
	"in_transit",
	"delivered",
	"completed",
	"cancelled"
];

async function fixExportShipmentStatuses() {
	try {
		// Connect to MongoDB
		const mongoUri = process.env.DATABASE_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/alnoran";
		console.log("Connecting to MongoDB...");
		await mongoose.connect(mongoUri);
		console.log("Connected to MongoDB");

		// Get the ExportShipment collection
		const db = mongoose.connection.db;
		const collection = db.collection("exportshipments");

		// Find all shipments with invalid statuses
		const invalidShipments = await collection.find({
			currentStatus: { $nin: VALID_STATUSES }
		}).toArray();

		console.log(`Found ${invalidShipments.length} shipments with invalid status values`);

		if (invalidShipments.length === 0) {
			console.log("No shipments need fixing. Exiting.");
			await mongoose.disconnect();
			return;
		}

		// Log which statuses are being fixed
		const statusCounts = {};
		invalidShipments.forEach(s => {
			statusCounts[s.currentStatus] = (statusCounts[s.currentStatus] || 0) + 1;
		});
		console.log("Invalid status counts:", statusCounts);

		// Update all invalid shipments to have "documents_verification" status
		const result = await collection.updateMany(
			{ currentStatus: { $nin: VALID_STATUSES } },
			{
				$set: { currentStatus: "documents_verification" },
				$push: {
					statusHistory: {
						status: "documents_verification",
						changedAt: new Date(),
						notes: "تم تصحيح الحالة تلقائياً (migration script)"
					}
				}
			}
		);

		console.log(`Updated ${result.modifiedCount} shipments`);
		console.log("Migration completed successfully!");

		await mongoose.disconnect();
		console.log("Disconnected from MongoDB");

	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

// Run the migration
fixExportShipmentStatuses();
