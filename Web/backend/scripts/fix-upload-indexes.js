const mongoose = require("mongoose");
const path = require("path");
const Upload = require("../src/models/upload");
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

const fixIndexes = async () => {
	try {
		console.log("🔍 Checking Upload collection indexes...\n");

		// Get all indexes
		const indexes = await Upload.collection.getIndexes();

		console.log("📋 Current indexes:");
		Object.keys(indexes).forEach((indexName) => {
			console.log(`   - ${indexName}:`, JSON.stringify(indexes[indexName]));
		});
		console.log("");

		// Check if filename_1 index exists
		if (indexes.filename_1) {
			console.log("⚠️  Found problematic index: filename_1");
			console.log("   This index prevents uploading files with the same name.");
			console.log("   Dropping this index...\n");

			await Upload.collection.dropIndex("filename_1");
			console.log("✅ Successfully dropped filename_1 index!");
			console.log("   You can now upload files with duplicate names.\n");
		} else {
			console.log("✅ No problematic filename index found.\n");
		}

		// Verify final indexes
		const finalIndexes = await Upload.collection.getIndexes();
		console.log("📋 Final indexes:");
		Object.keys(finalIndexes).forEach((indexName) => {
			console.log(`   - ${indexName}`);
		});
	} catch (error) {
		console.error("❌ Error fixing indexes:", error);
	} finally {
		await mongoose.connection.close();
		console.log("\n🔌 Database connection closed");
	}
};

// Run the script
connectDB().then(fixIndexes);
