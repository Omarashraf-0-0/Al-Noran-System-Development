const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
	createAcidRequest,
	getAllRequests,
	getRequestByAcid,
	updateAcidStatus,
	getAllRequestsForEmployee,
	updateAcidStatusByEmployee,
	deleteAcidRequest,
	lockAcidRequest,
	unlockAcidRequest,
	issueAcidWithConfirmation,
} = require("../controllers/acidController");

// @route   POST /api/acid
// @desc    Create new ACID request
router.post("/", protect, createAcidRequest);

// @route   GET /api/acid
// @desc    Get all ACID requests
router.get("/", protect, getAllRequests);

// @route   GET /api/acid/employee/all
// @desc    Get all ACID requests for employee (admin view)
router.get("/employee/all", protect, getAllRequestsForEmployee);

// @route   PATCH /api/acid/employee/:id/status
// @desc    Update ACID request status by employee
router.patch("/employee/:id/status", protect, updateAcidStatusByEmployee);

// @route   POST /api/acid/employee/:id/lock
// @desc    Lock ACID request for review
router.post("/employee/:id/lock", protect, lockAcidRequest);

// @route   POST /api/acid/employee/:id/unlock
// @desc    Unlock ACID request
router.post("/employee/:id/unlock", protect, unlockAcidRequest);

// @route   POST /api/acid/employee/:id/issue
// @desc    Issue ACID with confirmation
router.post("/employee/:id/issue", protect, issueAcidWithConfirmation);

// @route   DELETE /api/acid/:id
// @desc    Delete ACID request
router.delete("/:id", protect, deleteAcidRequest);

// @route   GET /api/acid/:acid
// @desc    Get ACID request by acidCode
router.get("/:acid", protect, getRequestByAcid);

// @route   PATCH /api/acid/:id
// @desc    Update ACID request status or acidCode
router.patch("/:id", protect, updateAcidStatus);

module.exports = router;
