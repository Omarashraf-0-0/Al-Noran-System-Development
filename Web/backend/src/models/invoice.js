const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    unsupportedItemName: {
      type: String,
      required: true,
      trim: true,
    },
    unsupportedItemPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    feeName: {
      type: String,
      required: true,
      trim: true,
    },
    feePrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
