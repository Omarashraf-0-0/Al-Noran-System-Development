const { body } = require('express-validator');

const signupValidationRules = [
  body('fullname', 'Full name is required').not().isEmpty().trim().escape(),
  body('username', 'Username is required').not().isEmpty().trim().escape(),
  body('phone', 'A valid phone number is required').isMobilePhone('any'),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('type', 'User type must be either client or employee').isIn(['client', 'employee']),

  body().custom((value, { req }) => {
    const { type, clientType, employeeType, ssn } = req.body;

    if (type === 'client') {
      if (!['commercial', 'factory', 'personal'].includes(clientType)) {
        throw new Error('Invalid client type. Must be commercial, factory, or personal.');
      }
      if (clientType === 'personal' && (!ssn || ssn.trim() === '')) {
        throw new Error('SSN is required for personal clients.');
      }
    }

    if (type === 'employee') {
      if (!['Regular Employee', 'Certified Employee', 'Department Manager', 'System Admin'].includes(employeeType)) {
        throw new Error('Invalid employee type specified.');
      }
    }
    
    return true;
  }),
];

module.exports = {
  signupValidationRules
};

