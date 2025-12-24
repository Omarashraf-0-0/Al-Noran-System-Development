const AcidRequest = require("../models/acid");
const notificationService = require("../services/notificationService");

// ✅ إنشاء طلب ACID جديد
const createAcidRequest = async (req, res) => {
	try {
		const { supplier, goods, uploads, shipmentType } = req.body;

		// Get userId from authenticated user (from protect middleware)
		const userId = req.user ? req.user._id : null;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "User not authenticated",
			});
		}

		// Validate required fields (only customsItem and description)
		if (!goods || !goods.customsItem || !goods.description) {
			return res.status(400).json({
				success: false,
				message: "Customs item and goods description are required",
			});
		}

		// Validate proforma invoice upload
		if (!uploads || uploads.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Proforma invoice is required",
			});
		}

		const newRequest = new AcidRequest({
			userId,
			supplier,
			goods,
			uploads: uploads || [], // Array of Upload document IDs
			shipmentType: shipmentType || "بحري", // Default to sea shipment
		});

		await newRequest.save();

		// Populate uploads to return full upload details
		await newRequest.populate("uploads");

		// 📬 Send notification to user
		try {
			await notificationService.createNotification({
				userId: userId,
				type: "acid_created",
				message: "تم استلام طلب ACID الخاص بك وجاري مراجعته",
				data: {
					acidRequestId: newRequest._id,
				},
				priority: "medium",
				sendPush: true, // Send push notification to mobile
			});
		} catch (notifError) {
			console.error("Failed to send notification:", notifError.message);
		}

		res.status(201).json({
			success: true,
			message: "ACID request created successfully",
			request: newRequest,
		});
	} catch (error) {
		console.error("Error creating ACID request:", error);
		res.status(500).json({
			success: false,
			message: "Server error while creating ACID request",
			error: error.message,
		});
	}
};

// ✅ عرض كل الطلبات
const getAllRequests = async (req, res) => {
	try {
		// Get userId from authenticated user (from protect middleware)
		const userId = req.user ? req.user._id : null;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "User not authenticated",
			});
		}

		// Filter requests by userId to show only current user's requests
		const requests = await AcidRequest.find({ userId })
			.sort({ requestDate: -1 })
			.populate("uploads");

		res.json({
			success: true,
			requests: requests,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching requests",
		});
	}
};

// ✅ عرض طلب واحد برقم ACID أو ID
const getRequestByAcid = async (req, res) => {
	try {
		const { acid } = req.params;
		const mongoose = require("mongoose");
		let request;

		// Check if the parameter is a valid MongoDB ObjectId
		if (mongoose.Types.ObjectId.isValid(acid)) {
			// Try to find by ID first
			request = await AcidRequest.findById(acid);
		}

		// If not found by ID, try to find by acidCode
		if (!request) {
			request = await AcidRequest.findOne({ acidCode: acid });
		}

		if (!request) {
			return res.status(404).json({ message: "ACID request not found" });
		}

		res.json(request);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error while fetching request" });
	}
};

// ✅ تحديث حالة الطلب أو إصدار كود ACID
const updateAcidStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			status,
			acidCode,
			supplier,
			goods,
			uploads,
			hasShipment,
			shipmentId,
			shipmentCreatedAt,
			shipmentType,
		} = req.body;

		const request = await AcidRequest.findById(id);

		if (!request) {
			return res.status(404).json({ message: "Request not found" });
		}

		// Check user type
		const userType = req.user.userType || req.user.type;
		const userId = req.user ? req.user._id : null;

		// If updating shipment fields, only employees can do it
		if (hasShipment !== undefined || shipmentId || shipmentCreatedAt) {
			if (userType !== "employee" && userType !== "admin") {
				return res.status(403).json({
					success: false,
					message: "Only employees and admins can update shipment information",
				});
			}
			// Allow employee to update shipment fields
			if (hasShipment !== undefined) request.hasShipment = hasShipment;
			if (shipmentId) request.shipmentId = shipmentId;
			if (shipmentCreatedAt) request.shipmentCreatedAt = shipmentCreatedAt;
		} else {
			// For non-shipment updates, check if request is locked
			if (request.isLocked) {
				return res.status(423).json({
					success: false,
					message:
						"This request is currently being reviewed by an employee and cannot be updated",
					isLocked: true,
				});
			}

			// Check if user owns this request
			if (userId && request.userId.toString() !== userId.toString()) {
				return res.status(403).json({
					success: false,
					message: "You don't have permission to update this request",
				});
			}

			// Update regular fields
			if (status) request.status = status;
			if (acidCode) request.acidCode = acidCode;
			if (supplier) request.supplier = supplier;
			if (goods) request.goods = goods;
			if (uploads) request.uploads = uploads;
			if (shipmentType) request.shipmentType = shipmentType;
		}

		await request.save();

		// 📬 Send notification for ACID status updates
		if (status || acidCode) {
			try {
				if (acidCode) {
					// ACID code issued
					await notificationService.notifyAcidIssued(
						request.userId,
						acidCode,
						request._id
					);
				} else if (status === "Rejected") {
					// ACID rejected
					await notificationService.createNotification({
						userId: request.userId,
						type: "acid_rejected",
						message: "تم رفض طلب ACID الخاص بك",
						data: {
							acidRequestId: request._id,
						},
						sendEmail: true,
						sendPush: true,
						priority: "high",
					});
				} else if (status === "Reviewing" || status === "Under Review") {
					// ACID under review
					await notificationService.createNotification({
						userId: request.userId,
						type: "acid_reviewing",
						message: "طلب ACID الخاص بك قيد المراجعة",
						data: {
							acidRequestId: request._id,
						},
						sendPush: true,
						priority: "medium",
					});
				}
			} catch (notifError) {
				console.error("Failed to send notification:", notifError.message);
			}
		}

		res.json({
			success: true,
			message: "ACID request updated successfully",
			request,
		});
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.json({ message: "Server error while updating ACID request" });
	}
};

// ✅ Get all ACID requests for employees (admin view)
const getAllRequestsForEmployee = async (req, res) => {
	try {
		// Check if user is employee (check both userType and type for compatibility)
		const userType = req.user.userType || req.user.type;
		if (userType !== "employee" && userType !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Access denied. Employees and Admins only.",
			});
		}

		const { myLocked, hasShipment, issuedByMe } = req.query;
		const query = {};

		if (myLocked === "true") {
			query.reviewingBy = req.user._id;
		}

		if (hasShipment === "true") {
			query.hasShipment = true;
		}

		if (issuedByMe === "true") {
			query.issuedBy = req.user._id;
		}

		// Get all requests without filtering by userId
		const requests = await AcidRequest.find(query)
			.populate("userId", "username email phone")
			.populate("uploads")
			.populate("reviewingBy", "username email")
			.populate("issuedBy", "username email")
			.populate("shipmentId")
			.sort({ requestDate: -1 })
			.lean();

		// Generate fresh presigned URLs for uploads
		const { getPresignedUrl } = require("../utils/s3Helpers");
		const requestsWithUrls = await Promise.all(
			requests.map(async (request) => {
				if (request.uploads && request.uploads.length > 0) {
					const uploadsWithUrls = await Promise.all(
						request.uploads.map(async (upload) => {
							try {
								if (upload.s3Key) {
									const presignedUrl = await getPresignedUrl(upload.s3Key, 3600);
									return { ...upload, s3Url: presignedUrl, url: presignedUrl, presignedUrl };
								}
								return upload;
							} catch (err) {
								console.error(`Error generating presigned URL for upload ${upload._id}:`, err.message);
								return upload;
							}
						})
					);
					return { ...request, uploads: uploadsWithUrls };
				}
				return request;
			})
		);

		res.json({
			success: true,
			requests: requestsWithUrls,
		});
	} catch (error) {
		console.error("Error fetching all ACID requests:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching requests",
		});
	}
};

// ✅ Update ACID request status by employee
const updateAcidStatusByEmployee = async (req, res) => {
	try {
		console.log("📝📝📝 [updateAcidStatusByEmployee] CALLED!");
		// Check if user is employee (check both userType and type for compatibility)
		const userType = req.user.userType || req.user.type;
		console.log(`📝 [updateAcidStatusByEmployee] User Type: ${userType}`);
		if (userType !== "employee" && userType !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Access denied. Employees and Admins only.",
			});
		}

		const { id } = req.params;
		const { status, acidCode, reviewingBy, rejectionReason } = req.body;

		const request = await AcidRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "Request not found",
			});
		}

		// Validate status
		const validStatuses = [
			"Pending",
			"Under Review",
			"ACID Issued",
			"Rejected",
		];
		if (status && !validStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: "Invalid status value",
			});
		}

		// Store old status for comparison
		const oldStatus = request.status;

		// Update fields
		if (status) request.status = status;
		if (acidCode) request.acidCode = acidCode;
		if (reviewingBy !== undefined) {
			request.reviewingBy = reviewingBy || null;
		}
		if (rejectionReason) request.rejectionReason = rejectionReason;

		await request.save({ validateModifiedOnly: true });

		// 📬 Send notifications based on status change
		console.log(`📬📬📬 [updateAcidStatusByEmployee] Status changed from '${oldStatus}' to '${status}'`);
		if (status && status !== oldStatus) {
			try {
				console.log(`📬 [updateAcidStatusByEmployee] Sending notification for status: ${status}`);
				if (status === "Rejected") {
					// ACID rejected
					console.log(`📬 Sending rejection notification to user: ${request.userId}`);
					await notificationService.createNotification({
						userId: request.userId,
						type: "acid_rejected",
						message: rejectionReason 
							? `تم رفض طلب ACID الخاص بك. السبب: ${rejectionReason}`
							: "تم رفض طلب ACID الخاص بك",
						data: {
							acidRequestId: request._id,
							reason: rejectionReason,
						},
						sendEmail: true,
						sendPush: true,
						priority: "high",
					});
					console.log(`✅ Rejection notification sent`);
				} else if (status === "Under Review") {
					// ACID under review
					console.log(`📬 Sending review notification to user: ${request.userId}`);
					await notificationService.createNotification({
						userId: request.userId,
						type: "acid_reviewing",
						message: "طلب ACID الخاص بك قيد المراجعة الآن",
						data: {
							acidRequestId: request._id,
						},
						sendPush: true,
						priority: "medium",
					});
					console.log(`✅ Review notification sent`);
				} else if (status === "ACID Issued" && acidCode) {
					// ACID issued
					console.log(`📬 Sending ACID issued notification to user: ${request.userId}`);
					await notificationService.notifyAcidIssued(
						request.userId,
						acidCode,
						request._id
					);
					console.log(`✅ ACID issued notification sent`);
				}
			} catch (notifError) {
				console.error("Failed to send notification:", notifError.message);
			}
		}

		res.json({
			success: true,
			message: "ACID request updated successfully",
			request,
		});
	} catch (error) {
		console.error("Error updating ACID request:", error);
		res.status(500).json({
			success: false,
			message: "Server error while updating ACID request",
		});
	}
};

// ✅ Delete ACID request (after shipment creation)
const deleteAcidRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const userType = req.user.userType || req.user.type;

		const request = await AcidRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "Request not found",
			});
		}

		// Allow deletion by employee or by the user who created it
		if (
			userType === "employee" ||
			userType === "admin" ||
			request.userId.toString() === req.user._id.toString()
		) {
			await AcidRequest.findByIdAndDelete(id);

			return res.json({
				success: true,
				message: "ACID request deleted successfully",
			});
		} else {
			return res.status(403).json({
				success: false,
				message: "You don't have permission to delete this request",
			});
		}
	} catch (error) {
		console.error("Error deleting ACID request:", error);
		res.status(500).json({
			success: false,
			message: "Server error while deleting ACID request",
		});
	}
};

// ✅ Lock ACID request for review (Employee starts reviewing)
const lockAcidRequest = async (req, res) => {
	try {
		console.log("🔒🔒🔒 [lockAcidRequest] CALLED!");
		const { id } = req.params;
		const employeeId = req.user._id;
		console.log(`🔒 [lockAcidRequest] Request ID: ${id}, Employee: ${employeeId}`);

		const request = await AcidRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "Request not found",
			});
		}

		// Check if already locked by another employee
		if (
			request.isLocked &&
			request.reviewingBy?.toString() !== employeeId.toString()
		) {
			const reviewer = await require("../models/user").findById(
				request.reviewingBy
			);
			return res.status(423).json({
				success: false,
				message: `This request is currently being reviewed by ${
					reviewer?.username || "another employee"
				}`,
				isLocked: true,
				reviewingBy: reviewer?.username,
			});
		}

		// Lock the request
		request.isLocked = true;
		request.reviewingBy = employeeId;
		request.reviewStartedAt = new Date();
		request.status = "Under Review";

		await request.save();

		// 📬 Send notification that review has started
		try {
			console.log(`📬📬📬 [lockAcidRequest] About to send notification!`);
			console.log(`📬 [lockAcidRequest] User ID: ${request.userId}`);
			console.log(`📬 [lockAcidRequest] Request ID: ${request._id}`);
			
			const result = await notificationService.createNotification({
				userId: request.userId,
				type: "acid_reviewing",
				message: "طلب ACID الخاص بك قيد المراجعة الآن",
				data: {
					acidRequestId: request._id,
				},
				sendPush: true,
				priority: "medium",
			});
			console.log(`✅✅✅ [lockAcidRequest] Notification created:`, result?._id);
		} catch (notifError) {
			console.error("Failed to send notification:", notifError.message);
		}

		// 📬 Notify employee about assigned ACID request
		try {
			await notificationService.createNotification({
				userId: employeeId,
				type: "acid_created",
				title: "تم تعيين طلب ACID جديد لك",
				message: `تم تعيين طلب ACID جديد لك للمراجعة`,
				data: {
					acidRequestId: request._id,
					clientId: request.userId,
					actionUrl: `/employee/acid-requests/${request._id}`,
				},
				sendPush: true,
				priority: "high",
			});
			console.log(`📬 Employee ${employeeId} notified about ACID assignment`);
		} catch (notifError) {
			console.error("❌❌❌ [lockAcidRequest] Failed to send review notification:", notifError.message);
			console.error("❌ Stack:", notifError.stack);
		}

		res.json({
			success: true,
			message: "Request locked for review",
			request,
		});
	} catch (error) {
		console.error("Error locking ACID request:", error);
		res.status(500).json({
			success: false,
			message: "Server error while locking request",
		});
	}
};

// ✅ Unlock ACID request (Employee cancels review or completes it)
const unlockAcidRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const employeeId = req.user._id;

		const request = await AcidRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "Request not found",
			});
		}

		// Only the reviewing employee can unlock
		if (request.reviewingBy?.toString() !== employeeId.toString()) {
			return res.status(403).json({
				success: false,
				message: "You don't have permission to unlock this request",
			});
		}

		// Unlock the request
		request.isLocked = false;
		request.reviewingBy = null;
		request.reviewStartedAt = null;
		if (request.status === "Under Review") {
			request.status = "Pending";
		}

		await request.save();

		res.json({
			success: true,
			message: "Request unlocked",
			request,
		});
	} catch (error) {
		console.error("Error unlocking ACID request:", error);
		res.status(500).json({
			success: false,
			message: "Server error while unlocking request",
		});
	}
};

// ✅ Issue ACID with confirmation (Employee confirms and issues ACID)
const issueAcidWithConfirmation = async (req, res) => {
	try {
		const { id } = req.params;
		const { acidCode, confirmed } = req.body;
		const employeeId = req.user._id;

		const request = await AcidRequest.findById(id)
			.populate("userId", "username email phone")
			.populate("uploads");

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "Request not found",
			});
		}

		// Check if locked by this employee
		if (
			!request.isLocked ||
			request.reviewingBy?.toString() !== employeeId.toString()
		) {
			return res.status(403).json({
				success: false,
				message: "You must lock this request before issuing ACID",
			});
		}

		// If not confirmed, return request data for final review
		if (!confirmed) {
			return res.json({
				success: true,
				needsConfirmation: true,
				message: "Please confirm the data before issuing ACID",
				request: {
					id: request._id,
					userId: request.userId,
					supplier: request.supplier,
					goods: request.goods,
					uploads: request.uploads,
					requestDate: request.requestDate,
				},
			});
		}

		// Validate ACID code
		if (!acidCode || acidCode.trim() === "") {
			return res.status(400).json({
				success: false,
				message: "ACID code is required",
			});
		}

		// Issue ACID
		request.status = "ACID Issued";
		request.acidCode = acidCode;
		request.isLocked = false;
		request.reviewingBy = null;
		request.issuedBy = employeeId;

		await request.save();

		// 📬 Send notification for ACID issuance
		try {
			console.log(`📬 Sending ACID issued notification to user: ${request.userId._id || request.userId}`);
			await notificationService.notifyAcidIssued(
				request.userId._id || request.userId,
				acidCode,
				request._id
			);
			console.log(`✅ ACID issued notification sent`);
		} catch (notifError) {
			console.error("Failed to send ACID issued notification:", notifError.message);
		}

		res.json({
			success: true,
			message: "ACID issued successfully",
			request,
		});
	} catch (error) {
		console.error("Error issuing ACID:", error);
		res.status(500).json({
			success: false,
			message: "Server error while issuing ACID",
		});
	}
};

module.exports = {
	createAcidRequest,
	getAllRequests,
	getRequestByAcid,
	updateAcidStatus,
	getAllRequestsForEmployee,
	updateAcidStatusByEmployee,
	deleteAcidRequest,
	lockAcidRequest,
	unlockAcidRequest,
	issueAcidWithConfirmation,
};
