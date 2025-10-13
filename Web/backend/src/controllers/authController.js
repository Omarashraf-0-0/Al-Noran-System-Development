const User = require('../models/user');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

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
    res.status(409);
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
  signup
};

