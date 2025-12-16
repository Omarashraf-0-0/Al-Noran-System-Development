const User = require("../models/user");
const Notification = require("../models/notifications");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const notifications = require("../models/notifications");
const phoneNumberValidation = require("../middleware/validation");
const { send_mail } = require("../services/mailer");
const ContactUs = require("../models/contactus");
const path = require("path");
const notificationService = require("../services/notificationService");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// @desc    Get all users
// @route   GET /api/users
// @access  Public (should be protected in production)
const getAllUsers = asyncHandler(async (req, res) => {
	const users = await User.find().select("-password").lean();

	if (!users?.length) {
		return res.status(400).json({ message: "No users found" });
	}

	res.json(users);
});

// @desc    Create new user
// @route   POST /api/users
// @access  Public (should be protected in production)
const createUser = asyncHandler(async (req, res) => {
	const {
		fullname,
		username,
		phone,
		email,
		password,
		type,
		clientType,
		ssn,
		employeeType,
	} = req.body;

	// Confirm data
	if (!fullname || !username || !phone || !email || !password || !type) {
		return res.status(400).json({ message: "All fields are required" });
	}

	// Check for duplicate
	const duplicate = await User.findOne({
		$or: [{ email }, { username }, { phone }],
	})
		.lean()
		.exec();

	if (duplicate) {
		return res.status(409).json({
			message: "User already exists with that email, username, or phone",
		});
	}

	// Create user data object
	const userData = {
		fullname,
		username,
		phone,
		email,
		password,
		type,
	};

	if (type === "client") {
		userData.clientDetails = { clientType };
		if (clientType === "personal") {
			userData.clientDetails.ssn = ssn;
		}
	} else if (type === "employee") {
		userData.employeeDetails = { employeeType };
	}

	// Create and store new user
	const user = await User.create(userData);

	if (user) {
		res.status(201).json({
			message: `New user ${username} created`,
			user: {
				id: user._id,
				fullname: user.fullname,
				username: user.username,
				email: user.email,
				type: user.type,
			},
		});
		console.log(`New user registered: ${user})`);
	} else {
		res.status(400).json({ message: "Invalid user data received" });
	}
});

// @desc    Update a user
// @route   PATCH /api/users/:id
// @access  Public (should be protected in production)
const updateUser = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const {
		fullname,
		username,
		phone,
		email,
		password,
		active,
		type,
		clientType,
		ssn,
		employeeType,
		taxNumber,
		rank,
	} = req.body;

	// Confirm data
	if (!id) {
		return res.status(400).json({ message: "User ID required" });
	}

	// Find user
	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: "User not found" });
	}

	// Check for duplicate
	if (username || email || phone) {
		const duplicate = await User.findOne({
			_id: { $ne: id },
			$or: [
				...(username ? [{ username }] : []),
				...(email ? [{ email }] : []),
				...(phone ? [{ phone }] : []),
			],
		})
			.lean()
			.exec();

		if (duplicate) {
			return res
				.status(409)
				.json({ message: "Username, email, or phone already taken" });
		}
	}

	// Update fields
	if (fullname) user.fullname = fullname;
	if (username) user.username = username;
	if (phone) user.phone = phone;
	if (email) user.email = email;
	if (password) user.password = password; // Will be hashed by the pre-save hook
	
	// Track if user is being activated
	const wasInactive = !user.active;
	const isBeingActivated = typeof active !== "undefined" && active === true && wasInactive;
	
	if (typeof active !== "undefined") user.active = active;
	if (type) user.type = type;
	if (taxNumber !== undefined) user.taxNumber = taxNumber;
	if (rank !== undefined) user.rank = rank || null;

	// Update type-specific details
	if (type === "client" && clientType) {
		user.clientDetails = user.clientDetails || {};
		user.clientDetails.clientType = clientType;
		if (clientType === "personal" && ssn) {
			user.clientDetails.ssn = ssn;
		}
		// Clear employee details if switching to client
		user.employeeDetails = undefined;
	}

	if (type === "employee") {
		user.employeeDetails = user.employeeDetails || {};
		if (employeeType) {
			user.employeeDetails.employeeType = employeeType;
		}
		// Clear client details if switching to employee or if clientType is null
		if (clientType === null || clientType === undefined) {
			user.clientDetails = { clientType: null, ssn: "" };
		}
	}

	const updatedUser = await user.save();

	// 📬 Send notification if user was activated
	if (isBeingActivated) {
		try {
			await notificationService.notifyAccountActivated(updatedUser._id);
		} catch (notifError) {
			console.error("Failed to send account activation notification:", notifError.message);
		}
	}

	res.json({
		message: `User ${updatedUser.username} updated`,
		user: {
			id: updatedUser._id,
			fullname: updatedUser.fullname,
			username: updatedUser.username,
			email: updatedUser.email,
			type: updatedUser.type,
			active: updatedUser.active,
		},
	});
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Public (should be protected in production)
const deleteUser = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({ message: "User ID Required" });
	}

	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: "User not found" });
	}

	const result = await user.deleteOne();

	const reply = `User ${result.fullname} with ID ${result._id} deleted`;

	res.json({ message: reply });
});

// @desc    Change user password
// @route   PUT /api/users/:id/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { currentPassword, newPassword } = req.body;

	console.log("🔐 [changePassword] User ID:", id);
	console.log("🔐 [changePassword] Request body:", {
		currentPassword: "***",
		newPassword: "***",
	});

	// Validate input
	if (!id || !currentPassword || !newPassword) {
		return res.status(400).json({
			success: false,
			message: "User ID, current password, and new password are required",
		});
	}

	// Find user with password
	const user = await User.findById(id).select("+password").exec();

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "User not found",
		});
	}

	// Verify current password
	const isPasswordMatch = await user.matchPassword(currentPassword);

	if (!isPasswordMatch) {
		return res.status(401).json({
			success: false,
			message: "Current password is incorrect",
		});
	}

	// Update password (will be hashed by pre-save hook)
	user.password = newPassword;
	await user.save();

	console.log("✅ [changePassword] Password changed successfully");

	// 📬 Send notification for password change
	try {
		await notificationService.createNotification({
			userId: user._id,
			type: "password_changed",
			message: "تم تغيير كلمة المرور الخاصة بك بنجاح. إذا لم تقم بهذا التغيير، يرجى التواصل معنا فوراً.",
			sendEmail: true,
			sendPush: true,
			priority: "high",
		});
		console.log(`📬 Password change notification sent to user: ${user._id}`);
	} catch (notifError) {
		console.error("Failed to send password change notification:", notifError.message);
	}

	res.json({
		success: true,
		message: "Password changed successfully",
	});
});

// @desc    Add multiple users
// @route   POST /api/users/addUsers
// @access  Private
const addUsers = async (req, res) => {
	const usersData = req.body;
	if (!Array.isArray(usersData)) {
		return res.status(400).json({ message: "Expected an array of users" });
	}
	try {
		const response = await User.insertMany(usersData, { ordered: false });
		if (response) {
			return res.status(200).json({
				message: "Users saved successfully",
				users: response,
			});
		} else {
			return res.status(400).json({ message: "Invalid user data received" });
		}
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

const getNotifications = async (req, res) => {
	const id = req.body.id; // todo there is a better practices here like using JWT
	try {
		const userNotifications = await Notification.find({
			receiverId: id,
			isRead: false,
		}).sort({ createdAt: -1 });
		return res.status(200).json({
			notifications: userNotifications,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

const sendNotification = async (req, res) => {
	try {
		const senderId = req.body.senderId;
		const { receiverId, category, content } = req.body;

		if (!receiverId)
			return res.status(400).json({ message: "No receiver ID provided" });
		if (!category)
			return res.status(400).json({ message: "No category provided" });
		if (!content)
			return res.status(400).json({ message: "Notification content is empty" });

		const userReceiver = await User.findById(receiverId);
		if (!userReceiver)
			return res.status(404).json({ message: "Receiver user not found" });

		const notification = await Notification.create({
			senderId,
			receiverId,
			category,
			content,
		});

		// TODO: Add real-time notification via Socket.io here

		return res.status(201).json({
			message: "Notification sent successfully",
			data: notification,
		});
	} catch (err) {
		return res.status(501).json({ message: err.message });
	}
};

// @desc    Contact Us form handler
// @route   POST /api/users/contact
// @access  Public
const contactUs = async (req, res) => {
	try {
		const data = req.body;
		const firstName = data.firstName;
		const secondName = data.secondName;
		const phone = data.phone;
		const email = data.email;
		const message = data.message;

		if (!firstName || !secondName) {
			return res.status(400).json({
				message: !firstName
					? "First name is not provided"
					: "Second name is not provided",
			});
		}

		const dbResponse = await ContactUs.insertOne({
			firstName,
			secondName,
			phone,
			email,
			message,
			createdAt: new Date(),
		});

		const mailMessage = `Hello,

		You received a new message from the Contact Us form.

		Name: ${firstName} ${secondName}
		Email: ${email}
		Phone Number: ${phone}

		Message:
		${message}

		Best regards,
		Your Website Team
		`;

		const mailMessageHTML = `
		<!DOCTYPE html>
		<html>
		<head>
		<meta charset="UTF-8">
		<title>Contact Us Message</title>
		<style>
			body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
			.container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
			h2 { color: #2c3e50; }
			p { margin: 5px 0; }
			.footer { margin-top: 20px; font-size: 0.9em; color: #777; }
		</style>
		</head>
		<body>
		<div class="container">
			<h2>New Contact Us Message</h2>
			<p><strong>Name:</strong> ${firstName} ${secondName}</p>
			<p><strong>Email:</strong> ${email}</p>
			<p><strong>Phone:</strong> ${phone}</p>
			<p><strong>Message:</strong></p>
			<p>${message}</p>
			<div class="footer">
			<p>Best regards,<br>Your Website Team</p>
			</div>
		</div>
		</body>
		</html>
		`;

		await send_mail(
			process.env.EMAIL_USER,
			"Contact Us Form",
			mailMessage,
			mailMessageHTML
		);

		return res.status(200).json({ message: "Mail sent successfully" });
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
	try {
		const userId = req.user?.id || req.user?._id;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized - User ID not found",
			});
		}

		const user = await User.findById(userId).select("-password").lean();

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			user: user,
		});
	} catch (error) {
		console.error("Get Profile Error:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
	try {
		const userId = req.user?.id || req.user?._id;
		const { fullname, username, phone, email, profilePhoto } = req.body;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized - User ID not found",
			});
		}

		// Validate required fields
		if (!fullname || !username || !phone || !email) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: "Invalid email format",
			});
		}

		// Validate phone format (10-15 digits)
		const phoneRegex = /^[0-9]{10,15}$/;
		if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
			return res.status(400).json({
				success: false,
				message: "Invalid phone number format",
			});
		}

		// Check for duplicate username, email, or phone (excluding current user)
		const duplicate = await User.findOne({
			_id: { $ne: userId },
			$or: [{ username }, { email }, { phone }],
		}).lean();

		if (duplicate) {
			let field = "Username";
			if (duplicate.email === email) field = "Email";
			else if (duplicate.phone === phone) field = "Phone number";

			return res.status(409).json({
				success: false,
				message: `${field} is already taken by another user`,
			});
		}

		// Find and update user
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		user.fullname = fullname;
		user.username = username;
		user.phone = phone;
		user.email = email;

		// Update profile photo if provided
		if (profilePhoto !== undefined) {
			console.log("📸 Updating profile photo to:", profilePhoto);
			user.profilePhoto = profilePhoto;
		}

		const updatedUser = await user.save();

		console.log(
			"✅ User updated successfully. Profile photo:",
			updatedUser.profilePhoto
		);

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			user: {
				id: updatedUser._id,
				fullname: updatedUser.fullname,
				username: updatedUser.username,
				phone: updatedUser.phone,
				email: updatedUser.email,
				type: updatedUser.type,
				profilePhoto: updatedUser.profilePhoto,
			},
		});
	} catch (error) {
		console.error("Update Profile Error:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
});

// @desc    Change password from profile
// @route   PUT /api/users/change-password
// @access  Private
const changePasswordProfile = asyncHandler(async (req, res) => {
	try {
		const userId = req.user?.id || req.user?._id;
		const { currentPassword, newPassword } = req.body;

		console.log("🔐 [Change Password] Request received");
		console.log("🔐 [Change Password] User ID:", userId);
		console.log("🔐 [Change Password] Current password provided:", currentPassword ? "YES" : "NO");
		console.log("🔐 [Change Password] New password provided:", newPassword ? "YES" : "NO");

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized - User ID not found",
			});
		}

		// Validate input
		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: "Current password and new password are required",
			});
		}

		// Validate new password length
		if (newPassword.length < 6) {
			return res.status(400).json({
				success: false,
				message: "New password must be at least 6 characters long",
			});
		}

		// Find user with password
		const user = await User.findById(userId).select("+password");

		console.log("🔐 [Change Password] User found:", user ? user.username : "NOT FOUND");
		console.log("🔐 [Change Password] User has password:", user?.password ? "YES" : "NO");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Verify current password
		console.log("🔐 [Change Password] Comparing passwords...");
		const isPasswordMatch = await user.matchPassword(currentPassword);
		console.log("🔐 [Change Password] Password match result:", isPasswordMatch);

		if (!isPasswordMatch) {
			return res.status(401).json({
				success: false,
				message: "Current password is incorrect",
			});
		}

		// Update password (will be hashed by pre-save hook)
		user.password = newPassword;
		await user.save();

		console.log("✅ Password changed successfully for user:", user.username);

		res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error("Change Password Error:", error);
		res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
});

// @desc    Suspend employee
// @route   PATCH /api/users/:id/suspend
// @access  Admin only
const suspendEmployee = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { reason } = req.body;

	const user = await User.findById(id);

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "المستخدم غير موجود",
		});
	}

	if (user.type !== "employee") {
		return res.status(400).json({
			success: false,
			message: "هذا المستخدم ليس موظفاً",
		});
	}

	user.employeeDetails.suspended = true;
	user.employeeDetails.suspensionReason = reason || "تم إيقافك عن العمل";
	user.employeeDetails.suspendedAt = new Date();

	await user.save();

	res.json({
		success: true,
		message: "تم إيقاف الموظف عن العمل بنجاح",
		user: {
			id: user._id,
			fullname: user.fullname,
			email: user.email,
			suspended: user.employeeDetails.suspended,
			suspensionReason: user.employeeDetails.suspensionReason,
		},
	});
});

// @desc    Unsuspend employee (reactivate)
// @route   PATCH /api/users/:id/unsuspend
// @access  Admin only
const unsuspendEmployee = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const user = await User.findById(id);

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "المستخدم غير موجود",
		});
	}

	if (user.type !== "employee") {
		return res.status(400).json({
			success: false,
			message: "هذا المستخدم ليس موظفاً",
		});
	}

	user.employeeDetails.suspended = false;
	user.employeeDetails.suspensionReason = null;
	user.employeeDetails.suspendedAt = null;

	await user.save();

	res.json({
		success: true,
		message: "تم إعادة تفعيل الموظف بنجاح",
		user: {
			id: user._id,
			fullname: user.fullname,
			email: user.email,
			suspended: user.employeeDetails.suspended,
		},
	});
});

// @desc    Check and update user verification status
// @route   GET /api/users/check-verification
// @access  Private
const checkVerificationStatus = asyncHandler(async (req, res) => {
	const userId = req.user?.id || req.user?._id;

	if (!userId) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const user = await User.findById(userId);
	if (!user) {
		return res.status(404).json({ message: "User not found" });
	}

	if (user.type !== "client") {
		return res.json({ verified: true, message: "User is not a client" });
	}

	const Upload = require("../models/upload");
	const status = await Upload.checkRequiredUploads(
		userId,
		user.clientDetails.clientType
	);

	if (status.completed && !user.clientDetails.documentsVerified) {
		user.clientDetails.documentsVerified = true;
		await user.save();
		console.log(`User ${userId} auto-verified via check endpoint`);
	}

	res.json({
		verified: user.clientDetails.documentsVerified,
		details: status,
		user: {
			...user.toObject(),
			clientDetails: user.clientDetails,
		},
	});
});

// @desc    Get client profile with all shipments and requests
// @route   GET /api/users/:clientId/profile?employeeId=xxx (optional filter)
// @access  Admin/Employee
const getClientProfile = asyncHandler(async (req, res) => {
	const { clientId } = req.params;
	const { employeeId } = req.query; // Optional filter for employee-specific data

	// Get client info
	const client = await User.findById(clientId).select("-password").lean();
	if (!client) {
		return res.status(404).json({ message: "Client not found" });
	}

	// Build query filters
	const importFilter = { user_id: clientId };
	const exportFilter = { userId: clientId };
	const acidFilter = { userId: clientId };
	const ucrFilter = { userId: clientId };

	// If employeeId is provided, filter by assigned employee
	if (employeeId) {
		importFilter.employee_id = employeeId;
		exportFilter.assignedEmployee = employeeId;
		acidFilter.assignedEmployee = employeeId;
		ucrFilter.assignedEmployee = employeeId;
	}

	// Get Shipments (Import)
	const Shipment = require("../models/shipment");
	const importShipments = await Shipment.find(importFilter)
		.sort({ createdAt: -1 })
		.lean();

	// Get Export Shipments
	let exportShipments = [];
	try {
		const ExportShipment = require("../models/exportShipment");
		exportShipments = await ExportShipment.find(exportFilter)
			.populate("ucrRequestId", "requestNumber")
			.sort({ createdAt: -1 })
			.lean();
	} catch (e) {
		console.log("ExportShipment model not found or error:", e.message);
	}

	// Get ACID Requests
	let acidRequests = [];
	try {
		const AcidRequest = require("../models/acidRequest");
		acidRequests = await AcidRequest.find(acidFilter)
			.sort({ createdAt: -1 })
			.lean();
	} catch (e) {
		console.log("AcidRequest model not found or error:", e.message);
	}

	// Get UCR Requests
	let ucrRequests = [];
	try {
		const UcrRequest = require("../models/ucrRequest");
		ucrRequests = await UcrRequest.find(ucrFilter)
			.sort({ createdAt: -1 })
			.lean();
	} catch (e) {
		console.log("UcrRequest model not found or error:", e.message);
	}

	res.json({
		success: true,
		client,
		importShipments,
		exportShipments,
		acidRequests,
		ucrRequests,
		filteredByEmployee: !!employeeId,
		stats: {
			totalImport: importShipments.length,
			totalExport: exportShipments.length,
			totalAcidRequests: acidRequests.length,
			totalUcrRequests: ucrRequests.length,
		},
	});
});

module.exports = {
	getAllUsers,
	createUser,
	updateUser,
	deleteUser,
	changePassword,
	addUsers,
	getNotifications,
	sendNotification,
	contactUs,
	getUserProfile,
	updateUserProfile,
	changePasswordProfile,
	suspendEmployee,
	unsuspendEmployee,
	checkVerificationStatus,
	getClientProfile,
};
