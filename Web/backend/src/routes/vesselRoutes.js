const express = require("express");
const router = express.Router();
const { trackVessel } = require("../controllers/vesselController");

router.get("/track", trackVessel);

module.exports = router;
