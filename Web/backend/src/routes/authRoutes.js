const express = require('express');
const router = express.Router();
const { signup } = require('../controllers/authController');
const { signupValidationRules } = require('../middleware/validation');

router.post('/signup', signupValidationRules, signup);

module.exports = router;

