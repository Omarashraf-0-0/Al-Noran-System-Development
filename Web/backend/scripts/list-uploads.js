const mongoose = require("mongoose");
const Upload = require("../src/models/upload");
const Shipment = require("../src/models/shipment");
require("dotenv").config();

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

const listUploads = async () => {
	try {
		// Find all shipment uploads
		const uploads = await Upload.find({ category: "shipment" })
			.populate("userId", "username email")
			.sort({ uploadedAt: -1 });

		console.log(`📁 Found ${uploads.length} shipment upload(s):\n`);

		uploads.forEach((upload, index) => {
			console.log(`${index + 1}. ${upload.originalname}`);
			console.log(`   ID: ${upload._id}`);
			console.log(`   Type: ${upload.documentType || "N/A"}`);
			console.log(`   Related ID: ${upload.relatedId}`);
			console.log(`   Uploaded by: ${upload.userId?.username || "Unknown"}`);
			console.log(`   Uploaded at: ${upload.uploadedAt}`);
			console.log(`   Description: ${upload.description || "N/A"}`);
			console.log("");
		});

		// Find all shipments with required documents
		const shipments = await Shipment.find({
			"requiredDocuments.0": { $exists: true },
		}).select("acid requiredDocuments");

		console.log(
			`\n📦 Found ${shipments.length} shipment(s) with required documents:\n`
		);

		shipments.forEach((shipment, index) => {
			console.log(`${index + 1}. ACID: ${shipment.acid} (ID: ${shipment._id})`);
			shipment.requiredDocuments.forEach((doc, docIndex) => {
				console.log(`   ${docIndex + 1}. ${doc.name}`);
				console.log(`      Uploaded: ${doc.uploaded ? "✅ Yes" : "❌ No"}`);
				console.log(`      File ID: ${doc.fileId || "N/A"}`);
				console.log(`      Requested: ${doc.requestedAt}`);
				if (doc.uploadedAt) {
					console.log(`      Uploaded At: ${doc.uploadedAt}`);
				}
			});
			console.log("");
		});
	} catch (error) {
		console.error("❌ Error listing uploads:", error);
	} finally {
		await mongoose.connection.close();
		console.log("🔌 Database connection closed");
	}
};

connectDB().then(listUploads);
