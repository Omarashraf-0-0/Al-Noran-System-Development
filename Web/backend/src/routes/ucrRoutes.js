const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
	// Client
	createUCRRequest,
	getMyUCRRequests,
	getUCRRequestById,
	updateUCRRequest,
	deleteUCRRequest,
	// Employee
	getAllUCRRequestsForEmployee,
	lockUCRRequest,
	unlockUCRRequest,
	issueUCRNumber,
	updateUCRStatusByEmployee,
	uploadCertificateOfOrigin,
	setRegulatoryBody,
	createExportShipmentFromUCR,
} = require("../controllers/ucrController");

// =====================================================
// CLIENT ROUTES
// =====================================================

// @route   POST /api/ucr
// @desc    Create new UCR request
// @access  Private (Client)
router.post("/", protect, createUCRRequest);

// @route   GET /api/ucr
// @desc    Get all UCR requests for current user
// @access  Private (Client)
router.get("/", protect, getMyUCRRequests);

// =====================================================
// EMPLOYEE ROUTES (must be before /:id to avoid conflict)
// =====================================================

// @route   GET /api/ucr/employee/all
// @desc    Get all UCR requests for employee
// @access  Private (Employee)
router.get("/employee/all", protect, getAllUCRRequestsForEmployee);

// @route   POST /api/ucr/employee/:id/lock
// @desc    Lock UCR request for review
// @access  Private (Employee)
router.post("/employee/:id/lock", protect, lockUCRRequest);

// @route   POST /api/ucr/employee/:id/unlock
// @desc    Unlock UCR request
// @access  Private (Employee)
router.post("/employee/:id/unlock", protect, unlockUCRRequest);

// @route   POST /api/ucr/employee/:id/issue-ucr
// @desc    Issue UCR number
// @access  Private (Employee)
router.post("/employee/:id/issue-ucr", protect, issueUCRNumber);

// @route   PATCH /api/ucr/employee/:id/status
// @desc    Update UCR request status
// @access  Private (Employee)
router.patch("/employee/:id/status", protect, updateUCRStatusByEmployee);

// @route   POST /api/ucr/employee/:id/certificate-of-origin
// @desc    Upload certificate of origin
// @access  Private (Employee)
router.post("/employee/:id/certificate-of-origin", protect, uploadCertificateOfOrigin);

// @route   POST /api/ucr/employee/:id/regulatory-body
// @desc    Set regulatory body
// @access  Private (Employee)
router.post("/employee/:id/regulatory-body", protect, setRegulatoryBody);

// @route   POST /api/ucr/employee/:id/create-shipment
// @desc    Create export shipment from UCR request
// @access  Private (Employee)
router.post("/employee/:id/create-shipment", protect, createExportShipmentFromUCR);

// =====================================================
// CLIENT ROUTES (with :id parameter - must be after /employee/ routes)
// =====================================================

// @route   GET /api/ucr/:id
// @desc    Get single UCR request by ID
// @access  Private (Client/Employee)
router.get("/:id", protect, getUCRRequestById);

// @route   PATCH /api/ucr/:id
// @desc    Update UCR request (only if pending)
// @access  Private (Client)
router.patch("/:id", protect, updateUCRRequest);

// @route   DELETE /api/ucr/:id
// @desc    Delete UCR request (only if pending)
// @access  Private (Client)
router.delete("/:id", protect, deleteUCRRequest);

module.exports = router;
