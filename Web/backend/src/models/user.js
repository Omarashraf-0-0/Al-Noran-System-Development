const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Please provide your full name'],
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],

  },
  resetOTP: { type: String },
  otpExpires: { type: Date },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  type: {
    type: String,
    required: true,
    enum: ['client', 'employee'],
  },
  active: {
    type: Boolean,
    default: true,
  },
  clientDetails: {
    clientType: {
      type: String,
      enum: ['commercial', 'factory', 'personal', null],
      default: null,
    },
    ssn: {
      type: String, 
      default: "",
    },
  },
  employeeDetails: {
    employeeType: {
      type: String,
      enum: ['Regular Employee', 'Certified Employee', 'Department Manager', 'System Admin', null],
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true 
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, username: this.username, email:this.email}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

