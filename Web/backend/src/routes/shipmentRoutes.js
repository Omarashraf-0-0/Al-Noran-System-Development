const express = require("express");
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

router.post("/", createShipment);
router.post("/addShipments", addShipments);
router.get("/getAll", getAllShipments);
router.get("/status/:acid", getShipmentStatusByAcid);
router.get("/:acid", getShipmentByAcid);
router.get("/status/number46/:number46", getShipmentStatusByNumber46);
router.patch("/:acid", updateShipmentStatus);
router.delete("/:acid", deleteShipment);
router.get("/employee/:employeeId", getShipmentrelatedToEmployee);
module.exports = router;
