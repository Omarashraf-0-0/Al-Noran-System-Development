const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerS3");
const { protect } = require("../middleware/auth");
const {
	uploadFile,
	uploadMultipleFiles,
	getUploads,
	getUploadById,
	deleteUpload,
	checkRequiredDocuments,
} = require("../controllers/uploadS3Controller");

/**
 * @route   POST /api/uploads
 * @desc    Upload single file to S3
 * @access  Private
 * @body    multipart/form-data with 'file' field + other fields
 */
router.post("/", protect, upload.single("file"), uploadFile);

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files to S3
 * @access  Private
 * @body    multipart/form-data with 'files' field (array)
 */
router.post("/multiple", protect, upload.array("files", 10), uploadMultipleFiles);

/**
 * @route   GET /api/uploads
 * @desc    Get uploads with filters
 * @access  Private
 * @query   userId, category, relatedId, userType, documentType
 */
router.get("/", protect, getUploads);

/**
 * @route   GET /api/uploads/check-required/:userId
 * @desc    Check if user completed required registration documents
 * @access  Private
 */
router.get("/check-required/:userId", protect, checkRequiredDocuments);

/**
 * @route   GET /api/uploads/:id
 * @desc    Get single upload by ID with presigned URL
 * @access  Private
 */
router.get("/:id", protect, getUploadById);

/**
 * @route   DELETE /api/uploads/:id
 * @desc    Delete upload from S3 and database
 * @access  Private
 */
router.delete("/:id", protect, deleteUpload);

module.exports = router;
