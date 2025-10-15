const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');


// Login Controller
const loginUser = async (req, res) => {
  
  const { identifier, password } = req.body; // identifier = email or user ID

    console.log('id : ' + identifier + 'pass : ' + password);
    

  try {
    // 1️⃣ Check if both fields are provided
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide identifier and password' });
    }

    // 2️⃣ Find user by email OR id
    console .log('Finding user...');
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier);
      console.log(user.id);
    } else {
      user = await User.findOne({ email: identifier });
      console.log(user.email);
   }


    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3️⃣ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch);
    console.log(password + ' ' + user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 4️⃣ Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '3d' } // token valid for 3 days
    );

    

    // 5️⃣ Respond with user info + token
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        type : user.type
      },
      token
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
    console.error('Login error:', err.message);
  }
};

module.exports = { loginUser };
