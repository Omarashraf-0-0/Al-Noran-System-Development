const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  ACID: {
    type: String,
    required: true,
    ref: 'Shipment' // ارتباط بالشحنة
  },
  invoices: [
    {
      invoiceNumber: String,
      description: String,
      amount: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  payments: [
    {
      paymentId: String,
      method: { type: String, enum: ['cash', 'card', 'bank_transfer'] },
      amount: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  balance: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Finance', financeSchema);
