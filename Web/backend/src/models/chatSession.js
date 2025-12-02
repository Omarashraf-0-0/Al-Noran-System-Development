const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assigned_agent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'open', 'closed'],
    default: 'pending',
    index: true
  },
  client_name: {
    type: String,
    required: true
  },
  client_email: {
    type: String,
    required: true
  },
  last_message: {
    type: String,
    default: ''
  },
  last_message_at: {
    type: Date,
    default: Date.now
  },
  unread_count: {
    type: Number,
    default: 0
  },
  closed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSessionSchema.index({ status: 1, assigned_agent_id: 1 });
chatSessionSchema.index({ client_id: 1, status: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
