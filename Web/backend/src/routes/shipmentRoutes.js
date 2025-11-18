const express = require("express");
const { protect } = require("../middleware/auth");
const {
	getShipmentById,
	updateShipmentStatus,
	getShipmentsByUserId,
	updateShipmentStatusById,
	requestRequiredDocuments,
	getRequiredDocuments,
	markDocumentAsUploaded,
	getEmployeeShipmentStats,
  createShipment,
  getAllShipments,
  getShipmentByAcid,
  getShipmentStatusByAcid,
  getShipmentStatusByNumber46,
  deleteShipment,
  getShipmentrelatedToEmployee,
  addShipments,
  mostActiveClients,
  getDashboardStats,
} = require("../controllers/shipmentController");

const router = express.Router();

// Static/specific routes first (order matters!)

// TODO : if u got a problem here probably cz route like "/most-active-clients"
// can't be reached because of "/:acid"
// good practive todo is to put the outes with acid lower

router.post("/", protect, createShipment);
router.post("/addShipments", protect, addShipments);
router.get("/get-dashboard-stats", protect, getDashboardStats);
router.get("/most-active-clients", mostActiveClients);
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
router.patch(
	"/id/:shipmentId/required-documents/:documentId",
	protect,
	markDocumentAsUploaded
);
router.get("/id/:shipmentId", protect, getShipmentById);

// ACID-based routes (more generic, must come after specific routes)
router.get("/:acid", protect, getShipmentByAcid);
router.patch("/:acid", protect, updateShipmentStatus);
router.delete("/:acid", protect, deleteShipment);

module.exports = router;
