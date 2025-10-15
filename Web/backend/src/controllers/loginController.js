const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');


// Login Controller
const loginUser = async (req, res) => {
  
  const { identifier, password } = req.body; // identifier = email or user ID

    
    

  try {
    //  Check if both fields are provided
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide identifier and password' });
    }

   
    //  Find user by email OR id

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ email: identifier });
   }


    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //  Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    //  Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email , type : user.type , username : user.username},
      process.env.JWT_SECRET,
      { expiresIn: '3d' } // token valid for 3 days
    );

    

    //  Respond with user info + token
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
