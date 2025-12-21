const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const User = require("./src/models/user");
const Upload = require("./src/models/upload");

const userId = "693f0f2be4be6eadadcff48a";

async function checkAndFixVerification() {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.DATABASE_URI);
		console.log("✅ Connected to MongoDB");

		// 1. Get user info
		const user = await User.findById(userId);
		if (!user) {
			console.log("❌ User not found");
			return;
		}

		console.log("\n📋 User Info:");
		console.log("- Username:", user.username);
		console.log("- Type:", user.type);
		console.log("- Client Type:", user.clientDetails?.clientType);
		console.log("- Documents Verified:", user.clientDetails?.documentsVerified);

		// 2. Get all uploads for this user
		const uploads = await Upload.find({
			userId: userId,
			category: { $in: ["registration", "client_registration_docs"] },
			isActive: true,
		});

		console.log("\n📄 User Uploads:");
		uploads.forEach((upload) => {
			console.log(`- ${upload.documentType}: ${upload.approvalStatus}`);
		});

		// 3. Check required documents
		const clientType = user.clientDetails?.clientType;
		const requiredDocs = Upload.getRequiredDocuments(clientType);
		console.log("\n✅ Required Documents for", clientType + ":");
		console.log(requiredDocs);

		// 4. Check what's approved
		const approvedDocs = await Upload.find({
			userId: userId,
			category: { $in: ["registration", "client_registration_docs"] },
			isActive: true,
			approvalStatus: "approved",
		}).distinct("documentType");

		console.log("\n✅ Approved Documents:");
		console.log(approvedDocs);

		// 5. Check what's missing
		const missing = requiredDocs.filter((doc) => !approvedDocs.includes(doc));
		console.log("\n⚠️ Missing Approved Documents:");
		console.log(missing);

		// 6. FIX: Approve all uploaded documents if they're pending
		console.log("\n🔧 Fixing approval status...");
		const pendingUploads = uploads.filter(
			(upload) => upload.approvalStatus === "pending"
		);

		if (pendingUploads.length > 0) {
			console.log(`Found ${pendingUploads.length} pending documents. Approving...`);
			for (const upload of pendingUploads) {
				upload.approvalStatus = "approved";
				upload.approvedBy = "System Auto-Approval"; // Or use an admin user ID
				upload.approvedAt = new Date();
				await upload.save();
				console.log(`✅ Approved: ${upload.documentType}`);
			}
		} else {
			console.log("No pending documents found.");
		}

		// 7. Re-check verification status
		const status = await Upload.checkRequiredUploads(userId, clientType);
		console.log("\n📊 Verification Status:");
		console.log("- Completed:", status.completed);
		console.log("- Missing:", status.missing);
		console.log("- Uploaded:", status.uploaded);

		// 8. Update user verification if completed
		if (status.completed && !user.clientDetails.documentsVerified) {
			user.clientDetails.documentsVerified = true;
			await user.save();
			console.log("\n✅ User verification status updated to TRUE");
		} else if (status.completed) {
			console.log("\n✅ User is already verified");
		} else {
			console.log("\n⚠️ User verification incomplete. Missing documents:");
			console.log(status.missing);
		}

		await mongoose.disconnect();
		console.log("\n✅ Done!");
	} catch (error) {
		console.error("❌ Error:", error);
		await mongoose.disconnect();
	}
}

checkAndFixVerification();
