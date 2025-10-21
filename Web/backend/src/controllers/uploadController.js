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
};
