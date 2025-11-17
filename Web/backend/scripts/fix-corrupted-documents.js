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

const fixCorruptedDocuments = async () => {
	try {
		console.log("🔧 Searching for corrupted required documents...\n");

		// Find all shipments with required documents
		const shipments = await Shipment.find({
			"requiredDocuments.0": { $exists: true },
		});

		console.log(
			`📦 Found ${shipments.length} shipment(s) with required documents\n`
		);

		let totalFixed = 0;
		let totalShipmentsFixed = 0;

		for (const shipment of shipments) {
			let hasCorrupted = false;
			let fixedCount = 0;

			shipment.requiredDocuments.forEach((doc, index) => {
				// Check for corrupted documents
				const isCorrupted =
					(doc.uploaded && !doc.fileId) ||
					(doc.uploaded && doc.fileId === "temp-file-id") ||
					doc.fileId === "temp-file-id" ||
					(doc.fileId === null && doc.uploaded);

				if (isCorrupted) {
					hasCorrupted = true;
					fixedCount++;
					console.log(`❌ Found corrupted document in ${shipment.acid}:`);
					console.log(`   Document: "${doc.name}"`);
					console.log(
						`   Current state: uploaded=${doc.uploaded}, fileId=${doc.fileId}`
					);

					// Reset to not uploaded state
					doc.uploaded = false;
					doc.fileId = null;
					doc.uploadedAt = null;

					console.log(`   ✅ Reset to: uploaded=false, fileId=null\n`);
				}
			});

			if (hasCorrupted) {
				await shipment.save();
				totalFixed += fixedCount;
				totalShipmentsFixed++;
				console.log(
					`✅ Fixed ${fixedCount} document(s) in shipment ${shipment.acid}\n`
				);
			}
		}

		if (totalFixed > 0) {
			console.log(
				`\n🎉 Fixed ${totalFixed} corrupted document(s) in ${totalShipmentsFixed} shipment(s)`
			);
		} else {
			console.log("\n✅ No corrupted documents found!");
		}
	} catch (error) {
		console.error("❌ Error fixing documents:", error);
	} finally {
		await mongoose.connection.close();
		console.log("\n🔌 Database connection closed");
	}
};

// Alternative: Just list corrupted documents without fixing
const listCorruptedDocuments = async () => {
	try {
		console.log("🔍 Listing corrupted required documents...\n");

		const shipments = await Shipment.find({
			"requiredDocuments.0": { $exists: true },
		});

		let totalCorrupted = 0;

		for (const shipment of shipments) {
			let shipmentHasCorrupted = false;

			shipment.requiredDocuments.forEach((doc) => {
				const isCorrupted =
					(doc.uploaded && !doc.fileId) ||
					(doc.uploaded && doc.fileId === "temp-file-id") ||
					doc.fileId === "temp-file-id" ||
					(doc.fileId === null && doc.uploaded);

				if (isCorrupted) {
					if (!shipmentHasCorrupted) {
						console.log(`📦 Shipment: ${shipment.acid} (ID: ${shipment._id})`);
						shipmentHasCorrupted = true;
					}
					totalCorrupted++;
					console.log(
						`   ❌ "${doc.name}": uploaded=${doc.uploaded}, fileId=${
							doc.fileId || "null"
						}`
					);
				}
			});

			if (shipmentHasCorrupted) {
				console.log("");
			}
		}

		if (totalCorrupted > 0) {
			console.log(`\n⚠️  Found ${totalCorrupted} corrupted document(s)`);
			console.log("Run without --list flag to fix them\n");
		} else {
			console.log("✅ No corrupted documents found!\n");
		}
	} catch (error) {
		console.error("❌ Error listing documents:", error);
	} finally {
		await mongoose.connection.close();
		console.log("🔌 Database connection closed");
	}
};

// Run the script
connectDB().then(() => {
	const mode = process.argv[2];

	if (mode === "--list") {
		listCorruptedDocuments();
	} else {
		fixCorruptedDocuments();
	}
});
