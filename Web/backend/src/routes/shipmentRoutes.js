const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createShipment,
  getAllShipments,
  getShipmentByAcid,
  updateShipmentStatus,
  getShipmentStatusByAcid,
  getShipmentStatusByNumber46,
  deleteShipment,
  getShipmentrelatedToEmployee,
  addShipments,
  mostActiveClients,
  getDashboardStats,
} = require("../controllers/shipmentController");

const router = express.Router();


// TODO : if u got a problem here probably cz route like "/most-active-clients"
// can't be reached because of "/:acid"
// good practive todo is to put the outes with acid lower

router.post("/", protect, createShipment);
router.post("/addShipments", protect, addShipments);
router.get("/get-dashboard-stats", protect, getDashboardStats);
router.get("/most-active-clients", mostActiveClients);
router.get("/getAll", protect, getAllShipments);
router.get("/status/:acid", protect, getShipmentStatusByAcid);
router.get("/:acid", protect, getShipmentByAcid);
router.get("/status/number46/:number46", protect, getShipmentStatusByNumber46);
router.patch("/:acid", protect, updateShipmentStatus);
router.delete("/:acid", protect, deleteShipment);
router.get("/employee/:employeeId", protect, getShipmentrelatedToEmployee);

module.exports = router;
