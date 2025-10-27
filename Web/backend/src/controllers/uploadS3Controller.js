const Upload = require("../models/upload");
const User = require("../models/user");
const {
	generateS3Key,
	uploadToS3,
	getPresignedUrl,
	deleteFromS3,
	validateFile,
} = require("../utils/s3Helpers");

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
		// Check if file exists
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}

		// Validate file
		const validation = validateFile(req.file);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		// Extract user info from JWT (req.user should be populated by auth middleware)
		const userId = req.user?.id || req.user?._id;
		if (!userId) {
			return res.status(401).json({ message: "User not authenticated" });
		}

		// Fetch user details
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const { category, relatedId, documentType, description, tags, userType: reqUserType, clientType: reqClientType } = req.body;

		// Validate required fields
		if (!category) {
			return res.status(400).json({ message: "Category is required" });
		}

		const validCategories = [
			"registration",
			"acid",
			"shipment",
			"invoice",
			"archive",
		];
		if (!validCategories.includes(category)) {
			return res
				.status(400)
				.json({ message: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
		}

		// Validate relatedId for specific categories
		if (
			["acid", "shipment", "invoice"].includes(category) &&
			!relatedId
		) {
			return res
				.status(400)
				.json({
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
			if (category === "registration" && !clientType) {
				return res
					.status(400)
					.json({
						message:
							"Client type is required for registration documents (factory, commercial, or personal)",
					});
			}

			// Validate clientType is valid
			if (clientType && !["factory", "commercial", "personal"].includes(clientType)) {
				return res
					.status(400)
					.json({
						message: "Invalid clientType. Must be: factory, commercial, or personal",
					});
			}
		}

		// Generate S3 key (path)
		const s3Key = generateS3Key({
			userId: userId.toString(),
			userType,
			category,
			relatedId,
			filename: req.file.originalname,
			clientType,
		});

		// Upload to S3
		const uploadResult = await uploadToS3({
			fileBuffer: req.file.buffer,
			s3Key,
			mimetype: req.file.mimetype,
		});

		if (!uploadResult.success) {
			return res.status(500).json({ message: "Failed to upload file to S3" });
		}

		// Create database record
		const uploadRecord = new Upload({
			userId,
			userType,
			clientType,
			category,
			documentType: documentType || null,
			relatedId: relatedId || null,
			filename: req.file.originalname,
			originalname: req.file.originalname,
			s3Key: uploadResult.s3Key,
			url: uploadResult.url,
			mimetype: req.file.mimetype,
			size: req.file.size,
			uploadedBy: userId,
			description: description || "",
			tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
		});

		await uploadRecord.save();

		// Generate presigned URL for immediate access
		const presignedUrl = await getPresignedUrl(uploadResult.s3Key, 3600); // 1 hour

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
		console.error("Upload Error:", error);
		res.status(500).json({ message: error.message || "Server error during upload" });
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

				// Create database record
				const uploadRecord = new Upload({
					userId,
					userType,
					clientType,
					category,
					relatedId: relatedId || null,
					filename: file.originalname,
					originalname: file.originalname,
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
				const presignedUrl = await getPresignedUrl(uploadResult.s3Key, 3600);

				uploadedFiles.push({
					id: uploadRecord._id,
					filename: uploadRecord.filename,
					s3Key: uploadRecord.s3Key,
					url: presignedUrl,
					size: uploadRecord.size,
					mimetype: uploadRecord.mimetype,
				});
			} catch (error) {
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
		res.status(500).json({ message: error.message || "Server error during upload" });
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
		const { userId, category, relatedId, userType, documentType } = req.query;

		// Build query
		const query = { isActive: true };

		if (userId) query.userId = userId;
		if (category) query.category = category;
		if (relatedId) query.relatedId = relatedId;
		if (userType) query.userType = userType;
		if (documentType) query.documentType = documentType;

		// If no userId in query, use authenticated user's ID
		if (!userId && req.user) {
			query.userId = req.user.id || req.user._id;
		}

		const uploads = await Upload.find(query)
			.sort({ uploadedAt: -1 })
			.populate("userId", "fullname email username type")
			.lean();

		// Generate presigned URLs for each upload
		const uploadsWithPresignedUrls = await Promise.all(
			uploads.map(async (upload) => {
				try {
					const presignedUrl = await getPresignedUrl(upload.s3Key, 3600);
					return {
						id: upload._id, // Add id field
						_id: upload._id, // Keep _id for backward compatibility
						filename: upload.filename,
						originalname: upload.originalname,
						s3Key: upload.s3Key,
						url: presignedUrl, // Presigned URL for immediate access
						category: upload.category,
						documentType: upload.documentType,
						userType: upload.userType,
						clientType: upload.clientType,
						mimetype: upload.mimetype,
						size: upload.size,
						uploadedAt: upload.uploadedAt,
						uploadedBy: upload.uploadedBy,
						userId: upload.userId,
						presignedUrl, // Also include as presignedUrl
					};
				} catch (error) {
					console.error(`Error generating presigned URL for ${upload.s3Key}:`, error);
					return {
						id: upload._id,
						_id: upload._id,
						...upload,
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
		res.status(500).json({ message: error.message || "Server error fetching uploads" });
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

		const upload = await Upload.findById(id).populate(
			"userId",
			"fullname email username type"
		);

		if (!upload) {
			console.log("Upload not found:", id);
			return res.status(404).json({ message: "Upload not found" });
		}

		console.log("Upload found:", upload.s3Key);

		// Generate fresh presigned URL (valid for 1 hour)
		const presignedUrl = await getPresignedUrl(upload.s3Key, 3600);
		console.log("Presigned URL generated successfully");

		res.status(200).json({
			success: true,
			upload: {
				id: upload._id,
				filename: upload.filename,
				originalname: upload.originalname,
				s3Key: upload.s3Key,
				url: presignedUrl, // Fresh presigned URL
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
			},
		});
	} catch (error) {
		console.error("Get Upload By ID Error:", error);
		console.error("Error stack:", error.stack);
		res.status(500).json({ 
			message: error.message || "Server error",
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
		if (upload.userId.toString() !== userId.toString() && req.user?.type !== "admin") {
			return res.status(403).json({ message: "Not authorized to delete this upload" });
		}

		// Delete from S3
		await deleteFromS3(upload.s3Key);

		// Soft delete from database
		upload.isActive = false;
		await upload.save();

		// Or hard delete:
		// await upload.deleteOne();

		res.status(200).json({
			success: true,
			message: "Upload deleted successfully",
		});
	} catch (error) {
		console.error("Delete Upload Error:", error);
		res.status(500).json({ message: error.message || "Server error deleting upload" });
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
			return res.status(400).json({ message: "Only applicable for client users" });
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

module.exports = {
	uploadFile,
	uploadMultipleFiles,
	getUploads,
	getUploadById,
	deleteUpload,
	checkRequiredDocuments,
};
