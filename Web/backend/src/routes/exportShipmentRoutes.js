const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
	// Client
	getMyExportShipments,
	getExportShipmentById,
	addDocumentToShipment,
	uploadRequiredDocument,
	// Employee
	getAllExportShipmentsForEmployee,
	updateExportShipmentStatus,
	assignEmployeeToShipment,
	addEmployeeNotes,
	requestDocumentFromClient,
	markPaymentCleared,
	uploadForm46,
	uploadCertificateOfOrigin,
	getShipmentStatusHistory,
} = require("../controllers/exportShipmentController");

// =====================================================
// CLIENT ROUTES
// =====================================================

// @route   GET /api/export-shipments
// @desc    Get all export shipments for current user
// @access  Private (Client)
router.get("/", protect, getMyExportShipments);

// =====================================================
// EMPLOYEE ROUTES (must be before /:id to avoid conflict)
// =====================================================

// @route   GET /api/export-shipments/employee/all
// @desc    Get all export shipments for employee
// @access  Private (Employee)
router.get("/employee/all", protect, getAllExportShipmentsForEmployee);

// =====================================================
// CLIENT/SHARED ROUTES (with :id parameter - must be after /employee/ routes)
// =====================================================

// @route   GET /api/export-shipments/:id
// @desc    Get single export shipment by ID
// @access  Private (Client/Employee)
router.get("/:id", protect, getExportShipmentById);

// @route   POST /api/export-shipments/:id/documents
// @desc    Add document to shipment
// @access  Private (Client)
router.post("/:id/documents", protect, addDocumentToShipment);

// @route   POST /api/export-shipments/:id/upload-required/:docName
// @desc    Upload required document (client responding to request)
// @access  Private (Client)
router.post("/:id/upload-required/:docName", protect, uploadRequiredDocument);

// @route   GET /api/export-shipments/:id/history
// @desc    Get shipment status history
// @access  Private (Client/Employee)
router.get("/:id/history", protect, getShipmentStatusHistory);

// @route   PATCH /api/export-shipments/employee/:id/status
// @desc    Update export shipment status
// @access  Private (Employee)
router.patch("/employee/:id/status", protect, updateExportShipmentStatus);

// @route   POST /api/export-shipments/employee/:id/assign
// @desc    Assign employee to shipment
// @access  Private (Employee)
router.post("/employee/:id/assign", protect, assignEmployeeToShipment);

// @route   PATCH /api/export-shipments/employee/:id/notes
// @desc    Add employee notes
// @access  Private (Employee)
router.patch("/employee/:id/notes", protect, addEmployeeNotes);

// @route   POST /api/export-shipments/employee/:id/request-document
// @desc    Request document from client
// @access  Private (Employee)
router.post("/employee/:id/request-document", protect, requestDocumentFromClient);

// @route   POST /api/export-shipments/employee/:id/payment-cleared
// @desc    Mark payment as cleared
// @access  Private (Employee)
router.post("/employee/:id/payment-cleared", protect, markPaymentCleared);

// @route   POST /api/export-shipments/employee/:id/form-46
// @desc    Upload Form 46
// @access  Private (Employee)
router.post("/employee/:id/form-46", protect, uploadForm46);

// @route   POST /api/export-shipments/employee/:id/certificate-of-origin
// @desc    Upload certificate of origin
// @access  Private (Employee)
router.post("/employee/:id/certificate-of-origin", protect, uploadCertificateOfOrigin);

module.exports = router;
