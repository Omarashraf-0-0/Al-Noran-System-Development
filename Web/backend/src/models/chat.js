const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderType: {
    type: String,
    enum: ['client', 'employee'],
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Null until assigned to an employee
  },
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    default: null, // Optional: link to specific shipment
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'pending'],
    default: 'pending',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update lastMessageAt and updatedAt before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Chat, Message };
