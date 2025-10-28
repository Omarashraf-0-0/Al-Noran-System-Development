const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
	{
		// User information
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		userType: {
			type: String,
			enum: ["client", "employee", "admin"],
			required: true,
		},
		clientType: {
			type: String,
			enum: ["factory", "commercial", "personal", null],
			default: null,
		},
		
		// File categorization
		category: {
			type: String,
			enum: ["registration", "acid", "shipment", "invoice", "archive"],
			required: true,
		},
		documentType: {
			type: String,
			enum: [
				// Factory documents (مصنع)
				"commercial_register",        // السجل التجاري
				"tax_card",                   // البطاقة الضريبية
				"contract",                   // العقد
				"industrial_register",        // السجل الصناعي
				"certificate_vat",            // شهادة القيمة المضافة
				"production_supplies",        // مستلزمات الإنتاج
				"power_of_attorney",          // التوكيل
				"personal_id_of_representative", // بطاقة ممثل/مندوب
				
				// Commercial documents (تجاري)
				"import_export_card",         // بطاقة استيراد/تصدير
				"trade_certificates",         // شهادات تجارية
				
				// Personal documents (فردي)
				"personal_id",                // البطاقة الشخصية
				"sample_document",            // مستند داعم
				
				// Shipment documents
				"bill_of_lading",
				"delivery_permit",
				"discharge_docs",
				"proforma_invoice",
				
				// Other
				"invoice",
				"report",
				"other",
				null
			],
			default: null,
		},
		relatedId: {
			type: String,
			default: null,
		},
		
		// File information
		filename: {
			type: String,
			required: true,
		},
		originalname: {
			type: String,
			required: true,
		},
		s3Key: {
			type: String,
			required: true,
			unique: true,
		},
		url: {
			type: String,
			required: true,
		},
		mimetype: {
			type: String,
			required: true,
		},
		size: {
			type: Number,
			required: true,
		},
		
		// Legacy fields (for backward compatibility)
		uploadedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		description: {
			type: String,
			default: "",
		},
		tags: [
			{
				type: String,
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Index for faster queries
uploadSchema.index({ userId: 1, category: 1 });
uploadSchema.index({ s3Key: 1 }, { unique: true });
uploadSchema.index({ userType: 1 });
uploadSchema.index({ category: 1 });
uploadSchema.index({ relatedId: 1 });
uploadSchema.index({ uploadedAt: -1 });
uploadSchema.index({ createdAt: -1 });

// Virtual for file extension
uploadSchema.virtual("extension").get(function () {
	return this.originalname.split(".").pop();
});

// Method to get file category
uploadSchema.methods.getFileCategory = function () {
	const ext = this.extension?.toLowerCase();
	if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
	if (["pdf"].includes(ext)) return "pdf";
	if (["doc", "docx"].includes(ext)) return "document";
	if (["xls", "xlsx"].includes(ext)) return "spreadsheet";
	return "other";
};

// Static method to get required documents by client type
uploadSchema.statics.getRequiredDocuments = function (clientType) {
	const requiredDocs = {
		factory: [
			"commercial_register",
			"tax_card",
			"contract",
			"industrial_register",
			"certificate_vat",
			"production_supplies",
			"power_of_attorney",
			"personal_id_of_representative",
		],
		commercial: [
			"commercial_register",
			"tax_card",
			"contract",
			"certificate_vat",
			"import_export_card",
			"power_of_attorney",
			"personal_id_of_representative",
			"trade_certificates",
		],
		personal: [
			"power_of_attorney",
			"personal_id",
			"sample_document",
		],
	};
	return requiredDocs[clientType] || [];
};

// Method to check if user has completed required uploads
uploadSchema.statics.checkRequiredUploads = async function (userId, clientType) {
	const required = this.getRequiredDocuments(clientType);
	const uploaded = await this.find({
		userId,
		category: "registration",
		isActive: true,
	}).distinct("documentType");
	
	const missing = required.filter(doc => !uploaded.includes(doc));
	return {
		completed: missing.length === 0,
		missing,
		uploaded,
		required,
	};
};

module.exports = mongoose.model("Upload", uploadSchema);
