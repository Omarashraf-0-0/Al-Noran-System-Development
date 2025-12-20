const mongoose = require("mongoose");

/**
 * Export Shipment Schema
 * 
 * This is the export equivalent of Shipment (which is for imports)
 * Created after UCR is approved and ready
 * 
 * Status Flow:
 * 1. documents_verification - التحقق من المستندات
 * 2. regulatory_inspection - فحص الجهات الرقابية (if applicable)
 * 3. payment_cleared - تم السداد
 * 4. goods_loaded - تم التحميل
 * 5. in_transit - في الطريق
 * 6. delivered - تم التسليم
 * 7. completed - مكتمل
 */

const exportShipmentSchema = new mongoose.Schema(
	{
		// =====================
		// References
		// =====================
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		ucrRequestId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "UCRRequest",
			required: true,
		},

		// =====================
		// Shipment Identification
		// =====================
		shipmentNumber: {
			type: String,
			unique: true,
			required: true,
		},
		ucrNumber: {
			type: String,
			required: true,
		},

		// =====================
		// Certification & Shipping Type
		// =====================
		certificationType: {
			type: String,
			enum: ["noran", "client"],
			required: true,
		},
		shippingMethod: {
			type: String,
			enum: ["air", "sea"],
			required: true,
		},

		// =====================
		// Destination Details
		// =====================
		destinationCountry: {
			type: String,
			required: true,
			trim: true,
		},
		destinationPort: {
			type: String,
			trim: true,
		},
		destinationAddress: {
			type: String,
			trim: true,
		},

		// =====================
		// Goods Details
		// =====================
		generalDescription: {
			type: String,
			required: true,
		},
		items: [
			{
				description: { type: String },
				hsCode: { type: String },
				quantity: { type: Number },
				weight: { type: Number },
				value: { type: Number },
				unit: { type: String },
			},
		],
		totalWeight: {
			type: Number,
			required: true,
		},
		packagesCount: {
			type: Number,
			required: false, // Not required for FCL (full container load)
			default: null,
		},
		valueInEGP: {
			type: Number,
			required: true,
		},

		// =====================
		// Sea Shipment Details
		// =====================
		containersCount: {
			type: Number,
			default: null,
		},
		containerWeights: [
			{
				containerNumber: { type: String },
				weight: { type: Number },
				unit: { type: String },
			},
		],
		billOfLadingNumber: {
			type: String,
			trim: true,
		},

		// =====================
		// Air Shipment Details
		// =====================
		awbNumber: {
			type: String,
			trim: true,
		},

		// =====================
		// Documents
		// =====================
		documents: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Upload",
			},
		],

		// =====================
		// Status Tracking
		// =====================
		currentStatus: {
			type: String,
			enum: [
				"documents_verification", // التحقق من المستندات
				"regulatory_inspection", // فحص الجهات الرقابية
				"payment_cleared", // تم السداد
				"goods_loaded", // تم التحميل
				"in_transit", // في الطريق
				"delivered", // تم التسليم
				"completed", // مكتمل
				"cancelled", // ملغي
			],
			default: "documents_verification",
		},
		statusHistory: [
			{
				status: {
					type: String,
					required: true,
				},
				changedAt: {
					type: Date,
					default: Date.now,
				},
				changedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				notes: {
					type: String,
					trim: true,
				},
			},
		],

		// =====================
		// Regulatory
		// =====================
		regulatoryBody: {
			type: String,
			default: null,
		},
		regulatoryApprovalDate: {
			type: Date,
			default: null,
		},
		regulatoryApprovalDocument: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Upload",
			default: null,
		},

		// =====================
		// Fees
		// =====================
		exportFee: {
			type: Number,
			default: 0,
		},
		serviceFees: {
			type: Number,
			default: 0,
		},
		totalFees: {
			type: Number,
			default: 0,
		},
		feePaid: {
			type: Boolean,
			default: false,
		},
		paymentDate: {
			type: Date,
			default: null,
		},

		// =====================
		// Certificate of Origin
		// =====================
		certificateOfOrigin: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Upload",
			default: null,
		},
		certificateOfOriginStatus: {
			type: String,
			enum: ["pending", "issued", "not_required", null],
			default: null,
		},
		certificateIssuedBy: {
			type: String,
			enum: ["noran", "client", null],
			default: null,
		},

		// =====================
		// Form 46
		// =====================
		form46Number: {
			type: String,
			default: null,
		},
		form46Document: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Upload",
			default: null,
		},

		// =====================
		// Employee Assignment
		// =====================
		assignedEmployee: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},

		// =====================
		// Timestamps
		// =====================
		createdAt: {
			type: Date,
			default: Date.now,
		},
		loadedAt: {
			type: Date,
			default: null,
		},
		departedAt: {
			type: Date,
			default: null,
		},
		deliveredAt: {
			type: Date,
			default: null,
		},
		completedAt: {
			type: Date,
			default: null,
		},

		// =====================
		// Notes
		// =====================
		clientNotes: {
			type: String,
			trim: true,
		},
		employeeNotes: {
			type: String,
			trim: true,
		},

		// =====================
		// Required Documents (Employee can request)
		// =====================
		requiredDocuments: [
			{
				name: {
					type: String,
					required: true,
					trim: true,
				},
				uploaded: {
					type: Boolean,
					default: false,
				},
				fileId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Upload",
				},
				requestedAt: {
					type: Date,
					default: Date.now,
				},
				uploadedAt: {
					type: Date,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

// =====================
// Indexes
// =====================
exportShipmentSchema.index({ userId: 1 });
exportShipmentSchema.index({ ucrRequestId: 1 });
exportShipmentSchema.index({ shipmentNumber: 1 }, { unique: true });
exportShipmentSchema.index({ ucrNumber: 1 });
exportShipmentSchema.index({ currentStatus: 1 });
exportShipmentSchema.index({ certificationType: 1 });
exportShipmentSchema.index({ shippingMethod: 1 });
exportShipmentSchema.index({ createdAt: -1 });
exportShipmentSchema.index({ assignedEmployee: 1 });

// =====================
// Static method to generate shipment number
// =====================
exportShipmentSchema.statics.generateShipmentNumber = async function (shippingMethod) {
	const year = new Date().getFullYear();
	const prefix = shippingMethod === "air" ? `EXP-AIR-${year}-` : `EXP-SEA-${year}-`;

	// Find the last shipment of this year and type
	const lastShipment = await this.findOne({
		shipmentNumber: new RegExp(`^${prefix}`),
	}).sort({ shipmentNumber: -1 });

	let nextNumber = 1;
	if (lastShipment) {
		const lastNumber = parseInt(lastShipment.shipmentNumber.split("-").pop());
		nextNumber = lastNumber + 1;
	}

	return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

// =====================
// Method to add status to history
// =====================
exportShipmentSchema.methods.addStatusHistory = function (status, userId, notes = "") {
	this.statusHistory.push({
		status,
		changedAt: new Date(),
		changedBy: userId,
		notes,
	});
	this.currentStatus = status;

	// Set timestamp based on status
	switch (status) {
		case "goods_loaded":
			this.loadedAt = new Date();
			break;
		case "in_transit":
			this.departedAt = new Date();
			break;
		case "delivered":
			this.deliveredAt = new Date();
			break;
		case "completed":
			this.completedAt = new Date();
			break;
	}
};

// =====================
// Method to calculate progress percentage
// =====================
exportShipmentSchema.methods.getProgressPercentage = function () {
	const statusOrder = [
		"documents_verification",
		"regulatory_inspection",
		"payment_cleared",
		"goods_loaded",
		"in_transit",
		"delivered",
		"completed",
	];

	const currentIndex = statusOrder.indexOf(this.currentStatus);
	if (currentIndex === -1) return 0;

	return Math.round(((currentIndex + 1) / statusOrder.length) * 100);
};

// =====================
// Pre-save middleware to add initial status history
// =====================
exportShipmentSchema.pre("save", function (next) {
	if (this.isNew && this.statusHistory.length === 0) {
		this.statusHistory.push({
			status: this.currentStatus,
			changedAt: new Date(),
			notes: "تم إنشاء الشحنة",
		});
	}
	next();
});

module.exports = mongoose.model("ExportShipment", exportShipmentSchema);
