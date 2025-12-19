const mongoose = require("mongoose");

const acidRequestSchema = new mongoose.Schema({
	// ✅ User ID reference
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},

	// ✅ بيانات المورد (فاتورة مبدئية) - Optional fields
	supplier: {
		name: { type: String },
		taxNum: { type: String },
		country: { type: String },
		email: { type: String },
		mobileNum: { type: String },
	},

	// ✅ بيانات البضاعة
	goods: {
		description: { type: String, required: true }, // وصف البضاعة - Required
		weight: { type: Number }, // الوزن المبدئي - Optional
		customsItem: { type: String, required: true }, // البند الجمركي - Required
	},

	// ✅ نوع الشحنة (بحري أو جوي)
	shipmentType: {
		type: String,
		enum: ["بحري", "جوي", "sea", "air"],
		default: "بحري",
	},

	// ✅ Uploaded documents
	uploads: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Upload",
		},
	],

	// ✅ بيانات الطلب العامة
	requestDate: { type: Date, default: Date.now },
	status: {
		type: String,
		enum: ["Pending", "Under Review", "ACID Issued", "Rejected"],
		default: "Pending",
	},
	acidCode: { type: String, default: null },

	// ✅ Review/Lock system
	reviewingBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		default: null,
	},
	issuedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		default: null,
	},
	reviewStartedAt: { type: Date, default: null },
	isLocked: { type: Boolean, default: false },

	// ✅ Shipment tracking
	hasShipment: { type: Boolean, default: false },
	shipmentId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Shipment",
		default: null,
	},
	shipmentCreatedAt: { type: Date, default: null },
});

module.exports = mongoose.model("AcidRequest", acidRequestSchema);
