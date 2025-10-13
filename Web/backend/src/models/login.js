const mongoose = require('mongoose');



///////////////////// TODO: This model might be unnecessary as login is typically handled via the User model. /////////////////////

const loginSchema = new mongoose.Schema({
  identifier: {  // can be email or user ID
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Login', loginSchema);
