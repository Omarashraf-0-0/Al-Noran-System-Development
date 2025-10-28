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
} = require("../controllers/shipmentController");

const router = express.Router();

router.post("/", protect, createShipment);
router.post("/addShipments", protect, addShipments);
router.get("/getAll", protect, getAllShipments);
router.get("/status/:acid", protect, getShipmentStatusByAcid);
router.get("/:acid", protect, getShipmentByAcid);
router.get("/status/number46/:number46", protect, getShipmentStatusByNumber46);
router.patch("/:acid", protect, updateShipmentStatus);
router.delete("/:acid", protect, deleteShipment);
router.get("/employee/:employeeId", protect, getShipmentrelatedToEmployee);

module.exports = router;
