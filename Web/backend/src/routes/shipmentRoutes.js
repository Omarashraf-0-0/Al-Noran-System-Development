const express = require("express");
const { protect } = require("../middleware/auth");
const {
	createShipment,
	getAllShipments,
	getShipmentByAcid,
	getShipmentById,
	updateShipmentStatus,
	getShipmentStatusByAcid,
	getShipmentStatusByNumber46,
	deleteShipment,
	getShipmentrelatedToEmployee,
	getShipmentsByUserId,
	addShipments,
	updateShipmentStatusById,
	requestRequiredDocuments,
	getRequiredDocuments,
	markDocumentAsUploaded,
	getEmployeeShipmentStats,
} = require("../controllers/shipmentController");

const router = express.Router();

// Static/specific routes first (order matters!)
router.post("/", protect, createShipment);
router.post("/addShipments", protect, addShipments);
router.get("/getAll", protect, getAllShipments);
router.get("/employee/:employeeId", protect, getShipmentrelatedToEmployee);
router.get("/employee/:employeeId/stats", protect, getEmployeeShipmentStats);
router.get("/user/:userId", protect, getShipmentsByUserId);
router.get("/status/:acid", protect, getShipmentStatusByAcid);
router.get("/status/number46/:number46", protect, getShipmentStatusByNumber46);

// ID-based routes (must come before ACID routes to avoid conflicts)
router.put("/id/:shipmentId", protect, updateShipmentStatusById);
router.post(
	"/id/:shipmentId/required-documents",
	protect,
	requestRequiredDocuments
);
router.get("/id/:shipmentId/required-documents", protect, getRequiredDocuments);
router.patch("/id/:shipmentId/required-documents/:documentId", protect, markDocumentAsUploaded);
router.get("/id/:shipmentId", protect, getShipmentById);

// ACID-based routes (more generic, must come after specific routes)
router.get("/:acid", protect, getShipmentByAcid);
router.patch("/:acid", protect, updateShipmentStatus);
router.delete("/:acid", protect, deleteShipment);

module.exports = router;
