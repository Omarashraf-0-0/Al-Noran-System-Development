const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
	{
		filename: {
			type: String,
			required: true,
			unique: true,
		},
		originalname: {
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
		path: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
		uploadType: {
			type: String,
			enum: ["user", "shipment", "other"],
			required: true,
		},
		uploadedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		relatedTo: {
			model: {
				type: String,
				enum: ["Shipment", "User", "AcidRequest", "Finance", null],
				default: null,
			},
			id: {
				type: String,
				default: null,
			},
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
	},
	{
		timestamps: true,
	}
);

// Index for faster queries (filename already has unique index from schema)
uploadSchema.index({ uploadType: 1 });
uploadSchema.index({ "relatedTo.model": 1, "relatedTo.id": 1 });
uploadSchema.index({ uploadedBy: 1 });
uploadSchema.index({ createdAt: -1 });

// Virtual for file extension
uploadSchema.virtual("extension").get(function () {
	return this.originalname.split(".").pop();
});

// Method to get file category
uploadSchema.methods.getFileCategory = function () {
	const ext = this.extension.toLowerCase();
	if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "image";
	if (["pdf"].includes(ext)) return "pdf";
	if (["doc", "docx"].includes(ext)) return "document";
	if (["xls", "xlsx"].includes(ext)) return "spreadsheet";
	return "other";
};

module.exports = mongoose.model("Upload", uploadSchema);
