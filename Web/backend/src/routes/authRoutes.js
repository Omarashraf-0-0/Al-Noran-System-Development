const express = require('express');
const router = express.Router();
const { login, signup } = require('../controllers/authController');
const { signupValidationRules } = require('../middleware/validation');

// Login route
router.post('/login', login);

// Signup route
router.post('/signup', signupValidationRules, signup);

module.exports = router;

