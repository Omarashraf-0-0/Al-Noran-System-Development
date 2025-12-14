const mongoose = require("mongoose");

/**
 * UCR Request Schema
 * UCR = Unified Customs Release (Export License)
 * 
 * This is the export equivalent of ACID Request (which is for imports)
 * 
 * Workflow:
 * 1. Client creates UCR request with goods details
 * 2. Employee reviews and extracts UCR number from government
 * 3. Documents are prepared (by Noran or Client based on certification type)
 * 4. Regulatory approval if needed
 * 5. Customs entry (Form 46)
 * 6. Ready to ship
 * 7. Certificate of Origin (after 3 days)
 * 8. Completed
 */

const ucrRequestSchema = new mongoose.Schema(
	{
		// =====================
		// User Reference
		// =====================
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		// =====================
		// Request Identification
		// =====================
		requestNumber: {
			type: String,
			unique: true,
			required: true,
		},
		ucrNumber: {
			type: String,
			default: null,
			sparse: true,
		},

		// =====================
		// Certification Type
		// =====================
		// 'noran' = على بطاقة الشركة (Green circle) - Noran handles docs, 10% fee
		// 'client' = على بطاقة العميل (Yellow circle) - Client provides docs, no auto fee
		certificationType: {
			type: String,
			enum: ["noran", "client"],
			required: true,
		},

		// =====================
		// Shipping Method
		// =====================
		shippingMethod: {
			type: String,
			enum: ["air", "sea"],
			required: true,
		},

		// =====================
		// Destination Info
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

		// =====================
		// Goods Information (Mandatory)
		// =====================
		generalDescription: {
			type: String,
			required: true,
			trim: true,
		},
		totalWeight: {
			type: Number,
			required: true,
			min: 0,
		},
		packagesCount: {
			type: Number,
			required: true,
			min: 1,
		},
		valueInEGP: {
			type: Number,
			required: true,
			min: 0,
		},
		originalInvoiceNumber: {
			type: String,
			required: true,
			trim: true,
		},
		invoiceDate: {
			type: Date,
			required: true,
		},

		// =====================
		// Sea Shipment Additional Fields
		// =====================
		quantity: {
			type: Number,
			default: null,
		},
		weightUnit: {
			type: String,
			enum: ["tons", "kilograms", null],
			default: null,
		},
		containersCount: {
			type: Number,
			default: null,
		},
		containerWeights: [
			{
				containerNumber: { type: String },
				weight: { type: Number },
				unit: { type: String, enum: ["tons", "kilograms"] },
			},
		],

		// =====================
		// Multiple Items Support (تعدد البنود)
		// =====================
		items: [
			{
				description: { type: String, required: true },
				hsCode: { type: String },
				quantity: { type: Number },
				weight: { type: Number },
				value: { type: Number },
				unit: { type: String },
			},
		],

		// =====================
		// Uploaded Documents
		// =====================
		uploads: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Upload",
			},
		],

		// =====================
		// Status Workflow
		// =====================
		status: {
			type: String,
			enum: [
				"pending", // في انتظار المراجعة
				"under_review", // قيد التدقيق
				"approved", // معتمد
				"needs_revision", // يحتاج تعديل
				"ucr_issued", // تم استخراج UCR
				"documents_prepared", // تم تجهيز المستندات (Noran only)
				"awaiting_regulatory_approval", // في انتظار موافقة الجهات الرقابية
				"customs_entry_46", // تم الإدراج ورقم 46
				"ready_to_ship", // جاهز للشحن
				"certificate_of_origin_pending", // في انتظار شهادة المنشأ
				"completed", // مكتمل
				"rejected", // مرفوض
			],
			default: "pending",
		},

		// =====================
		// Regulatory Body (الجهات الرقابية)
		// =====================
		regulatoryBody: {
			type: String,
			enum: [
				null,
				"goeic", // الهيئة العامة للرقابة على الصادرات والواردات
				"fsa", // هيئة سلامة الغذاء
				"agricultural_quarantine", // الحجر الزراعي
				"veterinary_quarantine", // الحجر البيطري
				"telecom_authority", // جهاز تنظيم الاتصالات
				"atomic_energy", // هيئة الطاقة الذرية
				"drug_authority", // هيئة الدواء المصرية
				"industrial_control", // مصلحة الرقابة الصناعية
				"hallmarking", // مصلحة دمغ المصوغات والموازين
				"consumer_protection", // جهاز حماية المستهلك
				"competition_protection", // جهاز حماية المنافسة
				"artistic_censorship", // جهاز الرقابة على المصنفات الفنية
				"press_censorship", // جهاز الرقابة على الصحف والمطبوعات
				"environment_agency", // جهاز شئون البيئة
				"anti_dumping", // جهاز مكافحة الدعم والإغراق والوقاية
				"fisheries", // جهاز حماية وتنمية البحيرات والثروة السمكية
				"roads_bridges", // الهيئة العامة للطرق والكباري والنقل البري
			],
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
		// Employee Actions
		// =====================
		customsEntryNumber46: {
			type: String,
			default: null,
		},
		certificateOfOrigin: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Upload",
			default: null,
		},
		certificateOfOriginUploadedAt: {
			type: Date,
			default: null,
		},

		// =====================
		// Fee Calculation (Noran Certified Only)
		// =====================
		// Formula: max(valueInEGP * 0.10, 3500)
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
		invoiceSentToMaker: {
			type: Boolean,
			default: false,
		},

		// =====================
		// Review/Lock System (same as ACID)
		// =====================
		reviewingBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		reviewStartedAt: {
			type: Date,
			default: null,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},

		// =====================
		// Linked Export Shipment
		// =====================
		hasExportShipment: {
			type: Boolean,
			default: false,
		},
		exportShipmentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ExportShipment",
			default: null,
		},
		exportShipmentCreatedAt: {
			type: Date,
			default: null,
		},

		// =====================
		// Timestamps
		// =====================
		requestDate: {
			type: Date,
			default: Date.now,
		},
		ucrIssuedAt: {
			type: Date,
			default: null,
		},
		documentsReadyAt: {
			type: Date,
			default: null,
		},
		readyToShipAt: {
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
		rejectionReason: {
			type: String,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

// =====================
// Indexes for faster queries
// =====================
ucrRequestSchema.index({ userId: 1 });
ucrRequestSchema.index({ status: 1 });
ucrRequestSchema.index({ requestNumber: 1 }, { unique: true });
ucrRequestSchema.index({ ucrNumber: 1 }, { sparse: true });
ucrRequestSchema.index({ certificationType: 1 });
ucrRequestSchema.index({ shippingMethod: 1 });
ucrRequestSchema.index({ requestDate: -1 });
ucrRequestSchema.index({ reviewingBy: 1 });

// =====================
// Static method to generate request number
// =====================
ucrRequestSchema.statics.generateRequestNumber = async function () {
	const year = new Date().getFullYear();
	const prefix = `UCR-${year}-`;
	
	// Find the last request of this year
	const lastRequest = await this.findOne({
		requestNumber: new RegExp(`^${prefix}`),
	}).sort({ requestNumber: -1 });

	let nextNumber = 1;
	if (lastRequest) {
		const lastNumber = parseInt(lastRequest.requestNumber.split("-").pop());
		nextNumber = lastNumber + 1;
	}

	return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

// =====================
// Method to calculate export fee (Noran Certified only)
// =====================
ucrRequestSchema.methods.calculateExportFee = function () {
	if (this.certificationType === "noran") {
		// 10% of value, minimum 3500 EGP
		const calculatedFee = this.valueInEGP * 0.1;
		this.exportFee = Math.max(calculatedFee, 3500);
	} else {
		this.exportFee = 0;
	}
	this.totalFees = this.exportFee + (this.serviceFees || 0);
	return this.exportFee;
};

// =====================
// Method to check if certificate of origin can be uploaded
// (Must wait 3 days after ready_to_ship)
// =====================
ucrRequestSchema.methods.canUploadCertificateOfOrigin = function () {
	if (this.status !== "ready_to_ship" && this.status !== "certificate_of_origin_pending") {
		return { allowed: false, reason: "يجب أن تكون الشحنة جاهزة للشحن أولاً" };
	}
	
	if (!this.readyToShipAt) {
		return { allowed: false, reason: "لم يتم تسجيل تاريخ الجاهزية للشحن" };
	}

	const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
	const timeSinceReadyToShip = Date.now() - new Date(this.readyToShipAt).getTime();
	
	if (timeSinceReadyToShip < threeDaysInMs) {
		const remainingDays = Math.ceil((threeDaysInMs - timeSinceReadyToShip) / (24 * 60 * 60 * 1000));
		return { 
			allowed: false, 
			reason: `يجب الانتظار ${remainingDays} يوم/أيام أخرى لرفع شهادة المنشأ` 
		};
	}

	return { allowed: true };
};

// =====================
// Pre-save middleware to calculate fees
// =====================
ucrRequestSchema.pre("save", function (next) {
	// Calculate fees if Noran certified and value changed
	if (this.isModified("valueInEGP") || this.isModified("certificationType")) {
		this.calculateExportFee();
	}
	next();
});

module.exports = mongoose.model("UCRRequest", ucrRequestSchema);
