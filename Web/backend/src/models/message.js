const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender_name: {
    type: String,
    required: true
  },
  sender_role: {
    type: String,
    enum: ['client', 'employee', 'admin'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachment: {
    url: String,
    filename: String,
    type: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
    index: true
  },
  read_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient message retrieval
messageSchema.index({ session_id: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
