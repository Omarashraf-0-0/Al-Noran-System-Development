const Upload = require("../models/upload");
const fs = require("fs");
const path = require("path");

// ✅ Create upload record in database
const createUploadRecord = async (
	fileData,
	uploadType,
	additionalData = {}
) => {
	try {
		const uploadRecord = new Upload({
			filename: fileData.filename,
			originalname: fileData.originalname,
			mimetype: fileData.mimetype,
			size: fileData.size,
			path: fileData.path,
			url: `/uploads/${uploadType}/${fileData.filename}`,
			uploadType:
				uploadType === "users"
					? "user"
					: uploadType === "shipments"
					? "shipment"
					: "other",
			uploadedBy: additionalData.uploadedBy || null,
			relatedTo: additionalData.relatedTo || { model: null, id: null },
			description: additionalData.description || "",
			tags: additionalData.tags || [],
		});

		await uploadRecord.save();
		return uploadRecord;
	} catch (error) {
		throw new Error(`Failed to create upload record: ${error.message}`);
	}
};

// ✅ Upload single file with database record
const uploadSingleFile = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}

		// Determine upload type from URL
		const uploadType = req.baseUrl.includes("users")
			? "users"
			: req.baseUrl.includes("shipments")
			? "shipments"
			: "other";

		// Additional data from request body (optional)
		const additionalData = {
			uploadedBy: req.body.uploadedBy || req.user?.id || null,
			relatedTo: req.body.relatedTo
				? JSON.parse(req.body.relatedTo)
				: { model: null, id: null },
			description: req.body.description || "",
			tags: req.body.tags ? JSON.parse(req.body.tags) : [],
		};

		// Create database record
		const uploadRecord = await createUploadRecord(
			req.file,
			uploadType,
			additionalData
		);

		res.status(200).json({
			message: "File uploaded successfully",
			file: {
				id: uploadRecord._id,
				filename: uploadRecord.filename,
				originalname: uploadRecord.originalname,
				url: uploadRecord.url,
				size: uploadRecord.size,
				mimetype: uploadRecord.mimetype,
				uploadType: uploadRecord.uploadType,
				createdAt: uploadRecord.createdAt,
			},
		});
	} catch (error) {
		// If database save fails, delete the uploaded file
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}
		res.status(500).json({ message: error.message });
	}
};

// ✅ Upload multiple files with database records
const uploadMultipleFiles = async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ message: "No files uploaded" });
		}

		const uploadType = req.baseUrl.includes("users")
			? "users"
			: req.baseUrl.includes("shipments")
			? "shipments"
			: "other";

		const additionalData = {
			uploadedBy: req.body.uploadedBy || req.user?.id || null,
			relatedTo: req.body.relatedTo
				? JSON.parse(req.body.relatedTo)
				: { model: null, id: null },
			description: req.body.description || "",
			tags: req.body.tags ? JSON.parse(req.body.tags) : [],
		};

		const uploadRecords = [];
		const uploadedFiles = [];

		// Create database records for all files
		for (const file of req.files) {
			try {
				const uploadRecord = await createUploadRecord(
					file,
					uploadType,
					additionalData
				);
				uploadRecords.push(uploadRecord);
				uploadedFiles.push({
					id: uploadRecord._id,
					filename: uploadRecord.filename,
					originalname: uploadRecord.originalname,
					url: uploadRecord.url,
					size: uploadRecord.size,
					mimetype: uploadRecord.mimetype,
					uploadType: uploadRecord.uploadType,
				});
			} catch (error) {
				// If one fails, delete its file
				if (fs.existsSync(file.path)) {
					fs.unlinkSync(file.path);
				}
			}
		}

		res.status(200).json({
			message: `${uploadedFiles.length} file(s) uploaded successfully`,
			files: uploadedFiles,
		});
	} catch (error) {
		// Cleanup all uploaded files on error
		if (req.files) {
			req.files.forEach((file) => {
				if (fs.existsSync(file.path)) {
					fs.unlinkSync(file.path);
				}
			});
		}
		res.status(500).json({ message: error.message });
	}
};

// ✅ Get all uploads
const getAllUploads = async (req, res) => {
	try {
		const {
			uploadType,
			page = 1,
			limit = 20,
			sortBy = "createdAt",
			order = "desc",
		} = req.query;

		const query = { isActive: true };
		if (uploadType) {
			query.uploadType = uploadType;
		}

		const uploads = await Upload.find(query)
			.populate("uploadedBy", "username email")
			.sort({ [sortBy]: order === "desc" ? -1 : 1 })
			.limit(limit * 1)
			.skip((page - 1) * limit)
			.exec();

		const count = await Upload.countDocuments(query);

		res.json({
			uploads,
			totalPages: Math.ceil(count / limit),
			currentPage: page,
			totalUploads: count,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ Get upload by ID
const getUploadById = async (req, res) => {
	try {
		const upload = await Upload.findById(req.params.id).populate(
			"uploadedBy",
			"username email"
		);

		if (!upload) {
			return res.status(404).json({ message: "Upload not found" });
		}

		// Generate presigned URL for S3 files
		if (upload.s3Key) {
			try {
				const { getPresignedUrl } = require("../utils/s3Helpers");
				const presignedUrl = await getPresignedUrl(upload.s3Key, 3600); // 1 hour expiry

				// Return upload data with presigned URL
				return res.json({
					...upload.toObject(),
					presignedUrl,
				});
			} catch (s3Error) {
				console.error("Error generating presigned URL:", s3Error);
				// If presigned URL generation fails, return upload data with regular URL
				return res.json(upload);
			}
		}

		res.json(upload);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ Get uploads by related entity
const getUploadsByRelatedEntity = async (req, res) => {
	try {
		const { model, id } = req.params;

		const uploads = await Upload.find({
			"relatedTo.model": model,
			"relatedTo.id": id,
			isActive: true,
		})
			.populate("uploadedBy", "username email")
			.sort({ createdAt: -1 });

		res.json({
			count: uploads.length,
			uploads,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ Update upload metadata
const updateUploadMetadata = async (req, res) => {
	try {
		const { description, tags, relatedTo } = req.body;

		const upload = await Upload.findById(req.params.id);
		if (!upload) {
			return res.status(404).json({ message: "Upload not found" });
		}

		if (description !== undefined) upload.description = description;
		if (tags !== undefined) upload.tags = tags;
		if (relatedTo !== undefined) upload.relatedTo = relatedTo;

		await upload.save();

		res.json({
			message: "Upload metadata updated successfully",
			upload,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ Delete upload (soft delete - mark as inactive)
const softDeleteUpload = async (req, res) => {
	try {
		const upload = await Upload.findById(req.params.id);

		if (!upload) {
			return res.status(404).json({ message: "Upload not found" });
		}

		upload.isActive = false;
		await upload.save();

		// Invalidate user verification if it's a client's registration document
		if (upload.userId && upload.category === "registration") {
			const User = require("../models/user");
			const user = await User.findById(upload.userId);
			if (user && user.type === "client") {
				user.clientDetails.documentsVerified = false;
				await user.save();
				console.log(`User ${user._id} verification invalidated due to document deletion.`);
			}
		}

		res.json({ message: "Upload deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ Delete upload permanently (remove file and database record)
const permanentDeleteUpload = async (req, res) => {
	try {
		const { filename } = req.params;

		// Find upload record
		const upload = await Upload.findOne({ filename });

		if (!upload) {
			return res.status(404).json({ message: "Upload record not found" });
		}

		// Delete physical file
		if (fs.existsSync(upload.path)) {
			fs.unlinkSync(upload.path);
		}

		// Delete database record
		await Upload.findByIdAndDelete(upload._id);

		// Invalidate user verification if it's a client's registration document
		if (upload.userId && upload.category === "registration") {
			const User = require("../models/user");
			const user = await User.findById(upload.userId);
			if (user && user.type === "client") {
				user.clientDetails.documentsVerified = false;
				await user.save();
				console.log(`User ${user._id} verification invalidated due to permanent document deletion.`);
			}
		}

		res.json({ message: "Upload permanently deleted" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ Get upload statistics
const getUploadStats = async (req, res) => {
	try {
		const stats = await Upload.aggregate([
			{ $match: { isActive: true } },
			{
				$group: {
					_id: "$uploadType",
					count: { $sum: 1 },
					totalSize: { $sum: "$size" },
				},
			},
		]);

		const totalCount = await Upload.countDocuments({ isActive: true });
		const totalSize = await Upload.aggregate([
			{ $match: { isActive: true } },
			{ $group: { _id: null, total: { $sum: "$size" } } },
		]);

		res.json({
			total: {
				count: totalCount,
				size: totalSize[0]?.total || 0,
			},
			byType: stats,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ Get all pending documents for admin approval
const getPendingDocuments = async (req, res) => {
	try {
		const { category, userType, clientType } = req.query;

		const query = {
			approvalStatus: "pending",
			category: "registration", // Only registration documents need approval
		};

		if (userType) query.userType = userType;
		if (clientType) query.clientType = clientType;

		const pendingDocs = await Upload.find(query)
			.populate("userId", "fullname username email clientDetails")
			.sort({ uploadedAt: -1 });

		res.json({
			success: true,
			count: pendingDocs.length,
			documents: pendingDocs,
		});
	} catch (error) {
		console.error("Error fetching pending documents:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching pending documents",
		});
	}
};

// ✅ Approve document
const approveDocument = async (req, res) => {
	try {
		const { id } = req.params;
		const adminId = req.user?._id;

		const document = await Upload.findById(id);

		if (!document) {
			return res.status(404).json({
				success: false,
				message: "Document not found",
			});
		}

		document.approvalStatus = "approved";
		document.approvedBy = adminId;
		document.approvedAt = new Date();
		document.rejectionReason = null;

		await document.save();

		// Check if user has verified all documents
		if (document.userId && document.userType === "client") {
			const Upload = require("../models/upload");
			const User = require("../models/user");
			
			// Re-fetch user to get client details
			const user = await User.findById(document.userId);
			
			if (user && user.type === "client") {
				const status = await Upload.checkRequiredUploads(
					document.userId,
					user.clientDetails.clientType
				);
				
				if (status.completed) {
					user.clientDetails.documentsVerified = true;
					await user.save();
					console.log(`User ${user._id} documents verified!`);
				}
			}
		}

		res.json({
			success: true,
			message: "Document approved successfully",
			document,
		});
	} catch (error) {
		console.error("Error approving document:", error);
		res.status(500).json({
			success: false,
			message: "Error approving document",
		});
	}
};

// ✅ Reject document
const rejectDocument = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason } = req.body;
		const adminId = req.user?._id;

		const document = await Upload.findById(id);

		if (!document) {
			return res.status(404).json({
				success: false,
				message: "Document not found",
			});
		}

		document.approvalStatus = "rejected";
		document.approvedBy = adminId;
		document.approvedAt = new Date();
		document.rejectionReason = reason || "No reason provided";

		await document.save();

		res.json({
			success: true,
			message: "Document rejected successfully",
			document,
		});
	} catch (error) {
		console.error("Error rejecting document:", error);
		res.status(500).json({
			success: false,
			message: "Error rejecting document",
		});
	}
};

module.exports = {
	uploadSingleFile,
	uploadMultipleFiles,
	getAllUploads,
	getUploadById,
	getUploadsByRelatedEntity,
	updateUploadMetadata,
	softDeleteUpload,
	permanentDeleteUpload,
	getUploadStats,
	getPendingDocuments,
	approveDocument,
	rejectDocument,
};
