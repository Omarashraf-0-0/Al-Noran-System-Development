const express = require('express');
const router = express.Router();
const { login, signup, getMe } = require('../controllers/authController');
const { signupValidationRules } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Login route
router.post('/login', login);

// Signup route
router.post('/signup', signupValidationRules, signup);

// Get current user info (protected)
router.get('/me', protect, getMe);

module.exports = router;

