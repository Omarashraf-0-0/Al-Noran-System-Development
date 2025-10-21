const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadController = require("../controllers/uploadController");

// Set up storage engine for multer
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		let uploadPath;
		if (req.baseUrl.includes("users")) {
			uploadPath = path.join(__dirname, "..", "..", "uploads", "users");
		} else if (req.baseUrl.includes("shipments")) {
			uploadPath = path.join(__dirname, "..", "..", "uploads", "shipments");
		} else {
			uploadPath = path.join(__dirname, "..", "..", "uploads", "others");
		}

		// Ensure the directory exists
		fs.mkdirSync(uploadPath, { recursive: true });
		cb(null, uploadPath);
	},
	filename: function (req, file, cb) {
		// Create unique filename with timestamp
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(
			null,
			file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
		);
	},
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
	const extname = allowedTypes.test(
		path.extname(file.originalname).toLowerCase()
	);
	const mimetype = allowedTypes.test(file.mimetype);

	if (mimetype && extname) {
		return cb(null, true);
	} else {
		cb(new Error("Only images, PDFs, and Office documents are allowed!"));
	}
};

// Configure multer
const upload = multer({
	storage: storage,
	limits: { fileSize: 16 * 1024 * 1024 }, // 16MB limit
	fileFilter: fileFilter,
});

// @route   POST /api/upload/users or /api/upload/shipments
// @desc    Upload single document (with MongoDB integration)
router.post("/", upload.single("document"), uploadController.uploadSingleFile);

// @route   POST /api/upload/users/multiple or /api/upload/shipments/multiple
// @desc    Upload multiple documents (with MongoDB integration)
router.post(
	"/multiple",
	upload.array("documents", 5),
	uploadController.uploadMultipleFiles
);

// @route   GET /api/upload
// @desc    Get all uploads (with pagination and filters)
router.get("/", uploadController.getAllUploads);

// @route   GET /api/upload/stats/summary
// @desc    Get upload statistics
router.get("/stats/summary", uploadController.getUploadStats);

// @route   GET /api/upload/:id
// @desc    Get upload by ID
router.get("/:id", uploadController.getUploadById);

// @route   GET /api/upload/related/:model/:id
// @desc    Get uploads by related entity
router.get("/related/:model/:id", uploadController.getUploadsByRelatedEntity);

// @route   PATCH /api/upload/:id
// @desc    Update upload metadata
router.patch("/:id", uploadController.updateUploadMetadata);

// @route   DELETE /api/upload/:id
// @desc    Soft delete upload (mark as inactive)
router.delete("/:id", uploadController.softDeleteUpload);

// @route   DELETE /api/upload/permanent/:filename
// @desc    Permanently delete upload (remove file and database record)
router.delete("/permanent/:filename", uploadController.permanentDeleteUpload);

// Error handling middleware for multer
router.use((error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		if (error.code === "LIMIT_FILE_SIZE") {
			return res
				.status(400)
				.json({ message: "File size too large. Maximum size is 16MB" });
		}
		if (error.code === "LIMIT_FILE_COUNT") {
			return res
				.status(400)
				.json({ message: "Too many files. Maximum is 5 files" });
		}
		if (error.code === "LIMIT_UNEXPECTED_FILE") {
			return res.status(400).json({ message: "Unexpected field name" });
		}
	}
	res.status(500).json({ message: error.message });
});

module.exports = router;
