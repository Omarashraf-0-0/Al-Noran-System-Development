const User = require('../models/user');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if password matches
  const isPasswordMatch = await user.matchPassword(password);

  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.active) {
    res.status(403);
    throw new Error('Your account has been deactivated');
  }

  // Create token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      type: user.type,
      phone: user.phone,
    }
  });
});

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map(e => e.msg).join(', '));
  }

  const {
    fullname,
    username,
    phone,
    email,
    password,
    type,
    clientType,
    ssn,
    employeeType
  } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }, { phone }] }).lean().exec();
  if (userExists) {
     res.status(409).json({
      success: false,
      error: 'A user with that email, username, or phone number already exists.'
    });
    throw new Error('A user with that email, username, or phone number already exists.');
  }

  const userData = {
    fullname,
    username,
    phone,
    email,
    password,
    type,
  };

  if (type === 'client') {
    userData.clientDetails = { clientType };
    if (clientType === 'personal') {
      userData.clientDetails.ssn = ssn;
    }
  } else if (type === 'employee') {
    userData.employeeDetails = { employeeType };
  }

  const user = await User.create(userData);

  if (user) {
    const token = user.getSignedJwtToken();
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
          id: user._id,
          fullname: user.fullname,
          username: user.username,
          type: user.type
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

module.exports = {
  login,
  signup
};

