const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc    Get all users
// @route   GET /api/users
// @access  Public (should be protected in production)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean();
  
  if (!users?.length) {
    return res.status(400).json({ message: 'No users found' });
  }
  
  res.json(users);
});

// @desc    Create new user
// @route   POST /api/users
// @access  Public (should be protected in production)
const createUser = asyncHandler(async (req, res) => {
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

  // Confirm data
  if (!fullname || !username || !phone || !email || !password || !type) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ $or: [{ email }, { username }, { phone }] })
    .lean()
    .exec();
    
  if (duplicate) {
    return res.status(409).json({ message: 'User already exists with that email, username, or phone' });
  }

  // Create user data object
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

  // Create and store new user
  const user = await User.create(userData);

  if (user) {
    res.status(201).json({
      message: `New user ${username} created`,
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        type: user.type
      }
    });
  } else {
    res.status(400).json({ message: 'Invalid user data received' });
  }
});

// @desc    Update a user
// @route   PATCH /api/users/:id
// @access  Public (should be protected in production)
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullname, username, phone, email, password, active, type, clientType, ssn, employeeType } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: 'User ID required' });
  }

  // Find user
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // Check for duplicate
  if (username || email || phone) {
    const duplicate = await User.findOne({
      _id: { $ne: id },
      $or: [
        ...(username ? [{ username }] : []),
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    }).lean().exec();

    if (duplicate) {
      return res.status(409).json({ message: 'Username, email, or phone already taken' });
    }
  }

  // Update fields
  if (fullname) user.fullname = fullname;
  if (username) user.username = username;
  if (phone) user.phone = phone;
  if (email) user.email = email;
  if (password) user.password = password; // Will be hashed by the pre-save hook
  if (typeof active !== 'undefined') user.active = active;
  if (type) user.type = type;

  // Update type-specific details
  if (type === 'client' && clientType) {
    user.clientDetails = user.clientDetails || {};
    user.clientDetails.clientType = clientType;
    if (clientType === 'personal' && ssn) {
      user.clientDetails.ssn = ssn;
    }
  }

  if (type === 'employee' && employeeType) {
    user.employeeDetails = user.employeeDetails || {};
    user.employeeDetails.employeeType = employeeType;
  }

  const updatedUser = await user.save();

  res.json({
    message: `User ${updatedUser.username} updated`,
    user: {
      id: updatedUser._id,
      fullname: updatedUser.fullname,
      username: updatedUser.username,
      email: updatedUser.email,
      type: updatedUser.type,
      active: updatedUser.active
    }
  });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Public (should be protected in production)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'User ID Required' });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const result = await user.deleteOne();

  const reply = `User ${result.fullname} with ID ${result._id} deleted`;

  res.json({ message: reply });
});


const addUsers = async (req,res) => {
  const usersData =  req.body;
  if (!Array.isArray(usersData)) {
      return res.status(400).json({ message: 'Expected an array of users' });
  }
  try{
    const response = await User.insertMany(usersData, { ordered: false });
    if(response)
    {
      return res.status(200).json({
        message:"Users saved successfully",
        users:response
      });
    }else {
      return res.status(400).json({ message: 'Invalid user data received' });
    }
  }catch(error) {
    return res.status(500).json({"error":error.message});
  }
};


module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  addUsers,
};
