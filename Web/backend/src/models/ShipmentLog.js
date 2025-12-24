const mongoose = require("mongoose");

const shipmentLogSchema = new mongoose.Schema(
	{
		shipmentId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			refPath: 'shipmentModel', // Dynamic reference
			index: true,
		},
		shipmentModel: {
			type: String,
			required: true,
			enum: ['Shipment', 'ExportShipment'],
			default: 'Shipment'
		},
		action: {
			type: String,
			required: true,
			enum: [
				"CREATED",
				"STATUS_UPDATE",
				"INFO_UPDATE",
				"ASSIGNMENT",
				"DOC_REQUEST",
				"DOC_UPLOAD",
				"DOC_REJECT",
				"DOC_DELETE",
				"OTHER",
			],
		},
		description: {
			type: String,
			required: true,
		},
		// A user-friendly description for the client to see
		publicDescription: {
			type: String,
		},
		performedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		performedByType: {
			type: String,
			enum: ["client", "employee", "admin", "system"],
			default: "system",
		},
		previousStatus: {
			type: String,
		},
		newStatus: {
			type: String,
		},
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
	}
);

// Index for fast retrieval of shipment history
shipmentLogSchema.index({ shipmentId: 1, createdAt: -1 });

module.exports = mongoose.model("ShipmentLog", shipmentLogSchema);
