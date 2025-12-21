const express = require('express');
const router = express.Router();
const { login, signup, checkAvailability, getMe, googleSignIn } = require('../controllers/authController');
const { signupValidationRules } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Login route
router.post('/login', login);

// Google Sign In route
router.post('/google', googleSignIn);

// Signup route
router.post('/signup', signupValidationRules, signup);

// Check username/email availability
router.post('/check-availability', checkAvailability);

// Get current user info (protected)
router.get('/me', protect, getMe);

module.exports = router;

