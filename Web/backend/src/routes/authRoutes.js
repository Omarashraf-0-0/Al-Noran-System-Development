const express = require('express');
const router = express.Router();
const { login, signup, checkAvailability } = require('../controllers/authController');
const { signupValidationRules } = require('../middleware/validation');

// Login route
router.post('/login', login);

// Signup route
router.post('/signup', signupValidationRules, signup);

// Check username/email availability
router.post('/check-availability', checkAvailability);

module.exports = router;

