/**
 * Helper Script to List Users
 * Run this to get user IDs for testing notifications:
 * node src/testing/list-users.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/alnoran";

async function listUsers() {
	try {
		console.log("🔌 Connecting to MongoDB...");
		await mongoose.connect(MONGO_URI);
		console.log("✅ Connected to MongoDB\n");

		// Get all users
		const users = await User.find({})
			.select("_id username fullname email type")
			.limit(20)
			.sort({ createdAt: -1 });

		if (users.length === 0) {
			console.log("⚠️  No users found in database");
			return;
		}

		console.log(`📋 Found ${users.length} users:\n`);
		console.log("─".repeat(80));
		console.log(
			"ID".padEnd(25) +
			"│ " +
			"Username".padEnd(15) +
			"│ " +
			"Full Name".padEnd(20) +
			"│ " +
			"Type"
		);
		console.log("─".repeat(80));

		users.forEach((user) => {
			console.log(
				`${user._id.toString()}`.padEnd(25) +
				`│ ${(user.username || "N/A").padEnd(15)}` +
				`│ ${(user.fullname || "N/A").padEnd(20)}` +
				`│ ${user.type || "N/A"}`
			);
		});

		console.log("─".repeat(80));
		console.log("\n💡 Copy a user ID from above to use in create-test-notifications.js");
		console.log("   Replace 'YOUR_USER_ID_HERE' with the copied ID\n");

	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await mongoose.connection.close();
		console.log("🔌 Disconnected from MongoDB");
		process.exit(0);
	}
}

// Run the script
listUsers();
