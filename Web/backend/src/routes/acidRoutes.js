const express = require('express');
const router = express.Router();
const {
  createAcidRequest,
  getAllRequests,
  getRequestByAcid,
  updateAcidStatus
} = require('../controllers/acidController');

// @route   POST /api/acid
// @desc    Create new ACID request
router.post('/', createAcidRequest);

// @route   GET /api/acid
// @desc    Get all ACID requests
router.get('/', getAllRequests);

// @route   GET /api/acid/:acid
// @desc    Get ACID request by acidCode
router.get('/:acid', getRequestByAcid);

// @route   PATCH /api/acid/:id
// @desc    Update ACID request status or acidCode
router.patch('/:id', updateAcidStatus);

module.exports = router;
