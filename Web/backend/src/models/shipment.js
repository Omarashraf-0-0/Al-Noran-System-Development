const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    // User reference
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Basic shipment info
    acid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    port_name: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Container details
    num_of_containers: {
      type: Number,
      required: true,
      min: 1,
    },
    type_of_containers: [
      {
        type: String,
        enum: ["20ft", "40ft", "45ft"],
      }
    ],
    
    // Customs and clearance
    third_gomroky: [
      {
        type: String,
        trim: true,
      }
    ],
    
    // Status and policy
    status: {
      type: String,
      enum: [
        "In Transit",
        "في انتظار الشحن",
        "في انتظار وصول الإذن",
        "جاري الكشف والتثمين",
        "تمت بنجاح",
        "Pending",
        "Arrived",
        "Customs Clearance",
        "Completed",
      ],
      default: "Pending",
    },
    policy: {
      type: String,
      trim: true,
      default: "",
    },
    
    // Draft flag
    dragt: {
      type: Boolean,
      default: false,
    },
    
    // Financial details
    clearance_fees: {
      type: Number,
      default: 0,
      min: 0,
    },
    expenses_and_tips: {
      type: Number,
      default: 0,
      min: 0,
    },
    sundries: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Legacy fields (keep for backward compatibility)
    importerName: {
      type: String,
      trim: true,
    },
    number46: {
      type: String,
      trim: true,
    },
    employerName: {
      type: String,
      trim: true,
    },
    shipmentDescription: {
      type: String,
      trim: true,
    },
    arrivalDate: {
      type: Date,
    },
    invoiceUrl: {
      type: String,
      trim: true,
    },
  },
  { 
    timestamps: true 
  }
);

// Indexes for better query performance
shipmentSchema.index({ user_id: 1 });
shipmentSchema.index({ acid: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ country: 1 });
shipmentSchema.index({ createdAt: -1 });

// Virtual for total costs
shipmentSchema.virtual("total_cost").get(function () {
  return this.clearance_fees + this.expenses_and_tips + this.sundries;
});

// Ensure virtuals are included in JSON
shipmentSchema.set("toJSON", { virtuals: true });
shipmentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Shipment", shipmentSchema);
