const express = require("express");
const { forgotPassword, verifyOTP, resetPassword } = require("../controllers/otpController.js");

const router = express.Router();

router.post("/forgotPassword", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.patch("/resetPassword", resetPassword);
module.exports = router;
