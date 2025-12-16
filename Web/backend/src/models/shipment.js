const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
	{
		// User reference
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		// Employee assigned to shipment (optional)
		employee_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},

		// ACID Request reference (optional - links to the original ACID request)
		acid_request_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "AcidRequest",
		},

		// Basic shipment info
		acid: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		shipment_type: {
			type: String,
			enum: ["بحري", "جوي", "sea", "air"],
			default: "بحري",
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
			},
		],

		// Customs and clearance
		third_gomroky: [
			{
				type: String,
				trim: true,
			},
		],

		// Status and policy
		status: {
			type: String,
			enum: [
				"Pending",
				"In Transit",
				"Arrived",
				"Customs Clearance",
				"Completed",
				"في انتظار الشحن",
				"في الطريق",
				"في انتظار وصول الإذن",
				"تم وصول الإذن",
				"جارى ادراج الشحنة واستكمال الاجراءات",
				"جاري الكشف والتثمين",
				"تمت بنجاح",
			],
			default: "في انتظار الشحن",
		},
		// Sub-status for "جاري الكشف والتثمين" phase
		subStatus: {
			type: String,
			enum: [
				null,
				"انتظار الرسوم الجمركية من المصلحة",
				"ادخال رقم المطالبة و صورة المطالبة",
				"اختيار جهة الدفع",
				"في انتظار استلام الافراج الجمركى",
				"مرحلة الترانزيت",
			],
			default: null,
		},
		// Payment party selection
		paymentParty: {
			type: String,
			enum: [null, "العميل", "الشركة"],
			default: null,
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

		// Required documents system
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
					type: String,
					trim: true,
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

		// Additional identifier
		shipmentCode: {
			type: String,
			trim: true,
			default: "",
		},
	},
	{
		timestamps: true,
	}
);

// Pre-save hook to generate shipment code
shipmentSchema.pre("save", async function (next) {
	if (this.shipmentCode) {
		return next();
	}

	try {
		const User = mongoose.model("User");
		const Counter = mongoose.model("Counter");

		// Get user to find clientId
		const user = await User.findById(this.user_id);
		if (!user) {
			return next(new Error("User not found for shipment code generation"));
		}

		// Get or create sequence for this user's shipments
		const counterName = `shipment_seq_${this.user_id}`;
		const counter = await Counter.findOneAndUpdate(
			{ name: counterName },
			{ $inc: { seq: 1 } },
			{ new: true, upsert: true }
		);

		// Format components
		// Prefix: Determine based on shipment_type (sea/air)
		let prefix = "SEA";
		const typeLower = (this.shipment_type || "").toLowerCase();
		if (typeLower.includes("air") || typeLower.includes("جوي")) {
			prefix = "AIR";
		}

		// Client ID: 4 digits (e.g., 0010)
		const clientIdStr = (user.clientId || 0).toString().padStart(4, "0");

		// Sequence: 4 digits (e.g., 0001)
		const seqStr = counter.seq.toString().padStart(4, "0");

		// Set the code
		this.shipmentCode = `${prefix}-${clientIdStr}-${seqStr}`;

		next();
	} catch (error) {
		next(error);
	}
});

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
