const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    acid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "في انتظار الشحن",
        "في انتظار وصول الإذن",
        "جاري الكشف والتثمين",
        "تمت بنجاح",
      ],
      default: "في انتظار الشحن",
    },
    importerName: String,
    number46: String,
    employerName: String,
    shipmentDescription: String,
    arrivalDate: Date,
    invoiceUrl: String, // لينك الفاتورة بعد التوليد
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
