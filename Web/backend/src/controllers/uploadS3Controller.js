const Upload = require("../models/upload");
const User = require("../models/user");
const {
	generateS3Key,
	uploadToS3,
	getPresignedUrl,
	deleteFromS3,
	validateFile,
} = require("../utils/s3Helpers");
const notificationService = require("../services/notificationService");

/**
 * @route   POST /api/uploads
 * @desc    Upload single file to S3 and save metadata to database
 * @access  Private (JWT required)
 * @body    {
 *            category: String (required) - registration | acid | shipment | invoice | archive
 *            relatedId: String (optional) - shipmentId | acidId | invoiceId
 *            documentType: String (optional) - type of document
 *            description: String (optional)
 *            tags: String[] (optional)
 *          }
 */
const uploadFile = async (req, res) => {
	try {
		console.log("🔵🔵🔵 [Backend Upload] بدء استقبال طلب رفع ملف");
		console.log(
			"📨 Request Headers:",
			req.headers.authorization ? "Bearer token present ✅" : "No token ❌"
		);
		console.log("📋 Request Body:", req.body);

		// Check if file exists
		if (!req.file) {
			console.log("❌ No file in request");
			return res.status(400).json({ message: "No file uploaded" });
		}

		console.log("📁 File received:", req.file.originalname);
		console.log("📦 File size:", (req.file.size / 1024).toFixed(2), "KB");
		console.log("📄 File type:", req.file.mimetype);

		// Validate file
		const validation = validateFile(req.file);
		if (!validation.valid) {
			console.log("❌ File validation failed:", validation.error);
			return res.status(400).json({ message: validation.error });
		}

		console.log("✅ File validation passed");

		// Extract user info from JWT (req.user should be populated by auth middleware)
		const userId = req.user?.id || req.user?._id;
		if (!userId) {
			console.log("❌ User not authenticated - no userId");
			return res.status(401).json({ message: "User not authenticated" });
		}

		console.log("👤 User ID:", userId);

		// Fetch user details
		const user = await User.findById(userId);
		if (!user) {
			console.log("❌ User not found in database");
			return res.status(404).json({ message: "User not found" });
		}

		console.log("✅ User found:", user.username, "|", user.email);

		const {
			category,
			relatedId,
			documentType,
			description,
			tags,
			userType: reqUserType,
			clientType: reqClientType,
		} = req.body;

		// Validate required fields
		if (!category) {
			console.log("❌ Category missing");
			return res.status(400).json({ message: "Category is required" });
		}

		console.log("📂 Category:", category);
		console.log("📄 Document Type:", documentType);

		const validCategories = [
			"registration",
			"acidrequest",
			"acid",
			"shipment",
			"invoice",
			"archive",
			"ucr_request",
			"payment",
			"export_shipment",
		];
		if (!validCategories.includes(category)) {
			console.log("❌ Invalid category:", category);
			return res.status(400).json({
				message: `Invalid category. Must be one of: ${validCategories.join(
					", "
				)}`,
			});
		}

		// Validate relatedId for specific categories
		if (["acid", "shipment", "invoice", "export_shipment"].includes(category) && !relatedId) {
			console.log("❌ relatedId required for category:", category);
			return res.status(400).json({
				message: `relatedId is required for category: ${category}`,
			});
		}

		// Determine userType and clientType
		// Priority: request body > user database record
		let userType = reqUserType || user.type; // client, employee, or admin
		let clientType = null;

		// If userType is client, get clientType
		if (userType === "client") {
			clientType = reqClientType || user.clientDetails?.clientType;

			// For registration category, validate required documents
			// Skip check for profilePhoto as it doesn't depend on client type
			if (category === "registration" && !clientType && documentType !== "profilePhoto") {
				console.log("❌ clientType required for registration");
				return res.status(400).json({
					message:
						"Client type is required for registration documents (factory, commercial, or personal)",
				});
			}

			// Validate clientType is valid
			if (
				clientType &&
				!["factory", "commercial", "personal"].includes(clientType)
			) {
				console.log("❌ Invalid clientType:", clientType);
				return res.status(400).json({
					message:
						"Invalid clientType. Must be: factory, commercial, or personal",
				});
			}
		}

		console.log("👥 User Type:", userType);
		console.log("🏭 Client Type:", clientType);

		// Generate S3 key (path)
		const s3Key = generateS3Key({
			userId: userId.toString(),
			userType,
			category,
			relatedId,
			filename: req.file.originalname,
			clientType,
		});

		console.log("🔑 Generated S3 Key:", s3Key);

		// Upload to S3
		console.log("⏳ جاري رفع الملف إلى S3...");
		const uploadResult = await uploadToS3({
			fileBuffer: req.file.buffer,
			s3Key,
			mimetype: req.file.mimetype,
		});

		if (!uploadResult.success) {
			console.log("❌❌❌ فشل رفع الملف إلى S3");
			return res.status(500).json({ message: "Failed to upload file to S3" });
		}

		console.log("✅✅ تم رفع الملف إلى S3 بنجاح");
		console.log("🔗 S3 URL:", uploadResult.url);

		// Generate unique filename for storage (prevents duplicates)
		const timestamp = Date.now();
		const sanitizedOriginalName = req.file.originalname.replace(
			/[^a-zA-Z0-9._-]/g,
			"_"
		);
		const uniqueFilename = `${timestamp}_${sanitizedOriginalName}`;

		// Create database record
		console.log("💾 جاري حفظ البيانات في MongoDB...");
		const uploadRecord = new Upload({
			userId,
			userType,
			clientType,
			category,
			documentType: documentType || null,
			relatedId: relatedId || null,
			filename: uniqueFilename, // Unique filename to prevent duplicates
			originalname: req.file.originalname, // Keep original for display
			s3Key: uploadResult.s3Key,
			url: uploadResult.url,
			mimetype: req.file.mimetype,
			size: req.file.size,
			uploadedBy: userId,
			description: description || "",
			tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
		});

		await uploadRecord.save();
		console.log("✅✅ تم حفظ البيانات في MongoDB بنجاح");
		console.log("🆔 Upload Record ID:", uploadRecord._id);

		// Generate presigned URL for immediate access
		let presignedUrl = null;
		try {
			presignedUrl = await getPresignedUrl(uploadResult.s3Key, 3600); // 1 hour
			console.log("✅ Presigned URL generated");
		} catch (urlError) {
			if (urlError.message === "AWS_PERMISSION_ERROR") {
				console.warn("⚠️ Could not generate presigned URL due to AWS permissions");
				// Continue without presigned URL
			} else {
				console.error("Error generating presigned URL:", urlError.message);
			}
		}

		console.log("✅✅✅ [Backend Upload SUCCESS] عملية الرفع اكتملت بنجاح!");
		console.log("📊 Summary:");
		console.log("   - User:", user.username);
		console.log("   - File:", req.file.originalname);
		console.log("   - Category:", category);
		console.log("   - Document Type:", documentType);
		console.log("   - S3 Key:", uploadResult.s3Key);
		console.log("   - Database ID:", uploadRecord._id);

		res.status(201).json({
			success: true,
			message: "File uploaded successfully",
			upload: {
				id: uploadRecord._id,
				filename: uploadRecord.filename,
				s3Key: uploadRecord.s3Key,
				url: presignedUrl, // Return presigned URL for immediate access
				publicUrl: uploadRecord.url, // Static URL (requires presigning to access)
				category: uploadRecord.category,
				documentType: uploadRecord.documentType,
				size: uploadRecord.size,
				mimetype: uploadRecord.mimetype,
				uploadedAt: uploadRecord.uploadedAt,
			},
		});
	} catch (error) {
		console.error("💥💥💥 [Backend Upload ERROR]:", error);
		console.error("Error Stack:", error.stack);
		res
			.status(500)
			.json({ message: error.message || "Server error during upload" });
	}
};

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files to S3
 * @access  Private (JWT required)
 */
const uploadMultipleFiles = async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ message: "No files uploaded" });
		}

		const userId = req.user?.id || req.user?._id;
		if (!userId) {
			return res.status(401).json({ message: "User not authenticated" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const { category, relatedId, description, tags } = req.body;

		if (!category) {
			return res.status(400).json({ message: "Category is required" });
		}

		const userType = user.type;
		const clientType = user.clientDetails?.clientType || null;

		const uploadedFiles = [];
		const errors = [];

		console.log(`[MultiUpload] Received ${req.files.length} files`);
		console.log(`[MultiUpload] Category: ${category}, User Type: ${userType}`);

		// Process each file
		for (let i = 0; i < req.files.length; i++) {
			const file = req.files[i];

			try {
				// Validate file
				const validation = validateFile(file);
				if (!validation.valid) {
					errors.push({
						filename: file.originalname,
						error: validation.error,
					});
					continue;
				}

				// Generate S3 key
				const s3Key = generateS3Key({
					userId: userId.toString(),
					userType,
					category,
					relatedId,
					filename: file.originalname,
					clientType,
				});

				// Upload to S3
				const uploadResult = await uploadToS3({
					fileBuffer: file.buffer,
					s3Key,
					mimetype: file.mimetype,
				});

				// Generate unique filename for storage (prevents duplicates)
				const timestamp = Date.now();
				const sanitizedOriginalName = file.originalname.replace(
					/[^a-zA-Z0-9._-]/g,
					"_"
				);
				const uniqueFilename = `${timestamp}_${sanitizedOriginalName}`;

				// Create database record
				const uploadRecord = new Upload({
					userId,
					userType,
					clientType,
					category,
					relatedId: relatedId || null,
					filename: uniqueFilename, // Unique filename to prevent duplicates
					originalname: file.originalname, // Keep original for display
					s3Key: uploadResult.s3Key,
					url: uploadResult.url,
					mimetype: file.mimetype,
					size: file.size,
					uploadedBy: userId,
					description: description || "",
					tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
				});

				await uploadRecord.save();

				// Generate presigned URL
				let presignedUrl = null;
				try {
					presignedUrl = await getPresignedUrl(uploadResult.s3Key, 3600);
				} catch (urlError) {
					if (urlError.message === "AWS_PERMISSION_ERROR") {
						console.warn(`⚠️ Could not generate presigned URL for ${file.originalname}`);
						// Continue without presigned URL
					}
				}

				uploadedFiles.push({
					id: uploadRecord._id,
					filename: uploadRecord.filename,
					s3Key: uploadRecord.s3Key,
					url: presignedUrl,
					size: uploadRecord.size,
					mimetype: uploadRecord.mimetype,
				});
			} catch (error) {
				console.error(`[MultiUpload] Error processing file ${file.originalname}:`, error);
				errors.push({
					filename: file.originalname,
					error: error.message,
				});
			}
		}

		res.status(201).json({
			success: true,
			message: `${uploadedFiles.length} file(s) uploaded successfully`,
			uploads: uploadedFiles,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("Multiple Upload Error:", error);
		res
			.status(500)
			.json({ message: error.message || "Server error during upload" });
	}
};

/**
 * @route   GET /api/uploads
 * @desc    Get uploads filtered by query parameters
 * @access  Private (JWT required)
 * @query   userId, category, relatedId, userType
 */
const getUploads = async (req, res) => {
	try {
		// Get userId from params (for /user/:userId route) or query
		const userId = req.params.userId || req.query.userId;
		const { category, relatedId, userType, documentType } = req.query;

		// Build query
		const query = { isActive: true };

		if (userId) query.userId = userId;
		if (category) query.category = category;
		if (relatedId) query.relatedId = relatedId;
		if (userType) query.userType = userType;
		if (documentType) query.documentType = documentType;

		// If no userId in query/params, use authenticated user's ID
		if (!userId && req.user) {
			query.userId = req.user.id || req.user._id;
		}

		console.log("🔍 [getUploads] Query:", query);

		const uploads = await Upload.find(query)
			.sort({ uploadedAt: -1 })
			.populate("userId", "fullname email username type")
			.lean();

		console.log(`📦 [getUploads] Found ${uploads.length} uploads`);

		// Generate presigned URLs for each upload
		const uploadsWithPresignedUrls = await Promise.all(
			uploads.map(async (upload) => {
				try {
					const presignedUrl = await getPresignedUrl(upload.s3Key, 3600);
					return {
						...upload,
						presignedUrl,
					};
				} catch (error) {
					if (error.message === "AWS_PERMISSION_ERROR") {
						console.warn(
							`⚠️ Could not generate presigned URL for ${upload.s3Key} - AWS permission issue`
						);
					} else {
						console.error(
							`Error generating presigned URL for ${upload.s3Key}:`,
							error.message
						);
					}
					// Return upload without presigned URL
					return {
						id: upload._id,
						_id: upload._id,
						...upload,
						presignedUrl: null,
						permissionError: error.message === "AWS_PERMISSION_ERROR",
					};
				}
			})
		);

		res.status(200).json({
			success: true,
			count: uploadsWithPresignedUrls.length,
			uploads: uploadsWithPresignedUrls,
		});
	} catch (error) {
		console.error("Get Uploads Error:", error);
		res
			.status(500)
			.json({ message: error.message || "Server error fetching uploads" });
	}
};

/**
 * @route   GET /api/uploads/:id
 * @desc    Get single upload by ID with presigned URL
 * @access  Private (JWT required)
 */
const getUploadById = async (req, res) => {
	try {
		const { id } = req.params;
		console.log("Fetching upload by ID:", id);

		// Validate ObjectId format
		if (!id || id === "temp-file-id" || !id.match(/^[0-9a-fA-F]{24}$/)) {
			console.log("Invalid upload ID format:", id);
			return res.status(400).json({
				message: "Invalid upload ID format",
				providedId: id,
			});
		}

		const upload = await Upload.findById(id).populate(
			"userId",
			"fullname email username type"
		);

		if (!upload) {
			console.log("Upload not found:", id);
			return res.status(404).json({ message: "Upload not found" });
		}

		console.log("Upload found:", upload.s3Key);

		// Try to generate fresh presigned URL (valid for 1 hour)
		let presignedUrl = null;
		let permissionError = false;
		let errorDetails = null;
		try {
			presignedUrl = await getPresignedUrl(upload.s3Key, 3600);
			console.log("✅ Presigned URL generated successfully");
		} catch (urlError) {
			if (urlError.message === "AWS_PERMISSION_ERROR") {
				console.error("❌ Cannot generate presigned URL due to AWS permissions");
				console.error("❌ IAM Policy Issue: Explicit deny for s3:GetObject detected");
				permissionError = true;
				errorDetails = {
					code: "AWS_PERMISSION_DENIED",
					message: "The AWS IAM user does not have permission to read files from S3",
					action: "Contact administrator to update IAM policy",
					technicalInfo: "IAM policy has explicit deny for s3:GetObject action"
				};
				// Continue with response but indicate the error
			} else {
				throw urlError; // Re-throw if it's a different error
			}
		}

		res.status(200).json({
			success: !permissionError,
			warning: permissionError
				? "⚠️ لا يمكن عرض الملف حالياً بسبب قيود AWS. يرجى الاتصال بالمسؤول.\n\nFile cannot be viewed due to AWS permission restrictions. Please contact administrator."
				: null,
			error: errorDetails,
			upload: {
				id: upload._id,
				filename: upload.filename,
				originalname: upload.originalname,
				s3Key: upload.s3Key,
				url: presignedUrl, // Will be null if permission error
				presignedUrl, // Also include as presignedUrl for backward compatibility
				category: upload.category,
				documentType: upload.documentType,
				userType: upload.userType,
				clientType: upload.clientType,
				mimetype: upload.mimetype,
				size: upload.size,
				uploadedAt: upload.uploadedAt,
				uploadedBy: upload.uploadedBy,
				userId: upload.userId,
				permissionError, // Flag to indicate AWS permission issue
			},
		});
	} catch (error) {
		console.error("Get Upload By ID Error:", error);
		console.error("Error stack:", error.stack);
		res.status(500).json({
			message: error.message || "Server error",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

/**
 * @route   PUT /api/uploads/:id
 * @desc    Update upload metadata (description, tags, etc.)
 * @access  Private (JWT required)
 */
const updateUpload = async (req, res) => {
	try {
		const { id } = req.params;
		const { description, tags } = req.body;

		console.log("📝 [updateUpload] Updating upload:", id);
		console.log("📝 [updateUpload] New description:", description);
		console.log("📝 [updateUpload] New tags:", tags);

		const upload = await Upload.findById(id);

		if (!upload) {
			return res.status(404).json({
				success: false,
				message: "Upload not found",
			});
		}

		// Check if user owns this upload (or is admin)
		const userId = req.user?.id || req.user?._id;
		if (
			upload.userId.toString() !== userId.toString() &&
			req.user?.type !== "admin"
		) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this upload",
			});
		}

		// Update fields
		if (description !== undefined) upload.description = description;
		if (tags !== undefined) upload.tags = tags;

		await upload.save();

		console.log("✅ [updateUpload] Upload updated successfully");

		res.status(200).json({
			success: true,
			message: "Upload updated successfully",
			upload: {
				id: upload._id,
				description: upload.description,
				tags: upload.tags,
			},
		});
	} catch (error) {
		console.error("❌ [updateUpload] Error:", error.message);
		res.status(500).json({
			success: false,
			message: "Server error updating upload",
		});
	}
};

/**
 * @route   DELETE /api/uploads/:id
 * @desc    Delete upload from S3 and database
 * @access  Private (JWT required)
 */
const deleteUpload = async (req, res) => {
	try {
		const { id } = req.params;

		const upload = await Upload.findById(id);

		if (!upload) {
			return res.status(404).json({ message: "Upload not found" });
		}

		// Check if user owns this upload (or is admin)
		const userId = req.user?.id || req.user?._id;
		if (
			upload.userId.toString() !== userId.toString() &&
			req.user?.type !== "admin"
		) {
			return res
				.status(403)
				.json({ message: "Not authorized to delete this upload" });
		}

		// Try to delete from S3, but continue if it fails due to permissions
		try {
			await deleteFromS3(upload.s3Key);
		} catch (s3Error) {
			console.warn(
				"S3 deletion failed (permissions issue), continuing with soft delete:",
				s3Error.message
			);
			// Continue with soft delete even if S3 delete fails
			// The file will remain in S3 but won't be accessible through the app
		}

		// Soft delete from database (mark as inactive)
		upload.isActive = false;

		await upload.save();
		// we need to change the status of the user.clientDetails.documentsVerified to false
		const user = await User.findById(userId);
		user.clientDetails.documentsVerified = false;
		await user.save();

		res.status(200).json({
			success: true,
			message: "Upload deleted successfully",
		});
	} catch (error) {
		console.error("Delete Upload Error:", error);
		res
			.status(500)
			.json({ message: error.message || "Server error deleting upload" });
	}
};

/**
 * @route   GET /api/uploads/check-required/:userId
 * @desc    Check if user has completed all required registration documents
 * @access  Private (JWT required)
 */
const checkRequiredDocuments = async (req, res) => {
	try {
		const { userId } = req.params;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (user.type !== "client") {
			return res
				.status(400)
				.json({ message: "Only applicable for client users" });
		}

		const clientType = user.clientDetails?.clientType;
		if (!clientType) {
			return res.status(400).json({ message: "Client type not set" });
		}

		const result = await Upload.checkRequiredUploads(userId, clientType);

		res.status(200).json({
			success: true,
			clientType,
			...result,
		});
	} catch (error) {
		console.error("Check Required Documents Error:", error);
		res.status(500).json({ message: error.message || "Server error" });
	}
};

/**
 * Get presigned URL for an S3 key
 */
const getPresignedUrlForKey = async (req, res) => {
	try {
		const s3Key = decodeURIComponent(req.params.s3Key);

		console.log("🔗 Generating presigned URL for key:", s3Key);

		const presignedUrl = await getPresignedUrl(s3Key, 3600); // 1 hour

		res.status(200).json({
			success: true,
			url: presignedUrl,
			expiresIn: 3600
		});
	} catch (error) {
		console.error("Get Presigned URL Error:", error);
		res.status(500).json({ message: error.message || "Failed to generate presigned URL" });
	}
};

module.exports = {
	uploadFile,
	uploadMultipleFiles,
	getUploads,
	getUploadById,
	updateUpload,
	deleteUpload,
	checkRequiredDocuments,
	getPresignedUrlForKey,
};
