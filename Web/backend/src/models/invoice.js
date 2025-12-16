const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
      trim: true,
    },
    itemPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currencyType: {
      type: String,
      enum: ["USD", "EGP"],
      required: true,
    },
  }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceItems: {
      type: [invoiceItemSchema],
      required: true,
      validate: [
        (v) => v.length > 0,
        "Invoice must contain at least one item",
      ],
    },
    status: {
      type: String,
      enum: [
        "في انتظار الموافقة",
        "تمت الموافقة",
        "مرفوض",
        "تم الدفع"
      ],
      default: "في انتظار الموافقة",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
