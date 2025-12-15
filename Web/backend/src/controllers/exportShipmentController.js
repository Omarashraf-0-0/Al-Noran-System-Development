const ExportShipment = require("../models/exportShipment");
const UCRRequest = require("../models/ucrRequest");

// =====================================================
// CLIENT ENDPOINTS
// =====================================================

/**
 * Get all Export Shipments for current user (client)
 * @route GET /api/export-shipments
 * @access Private (Client)
 */
const getMyExportShipments = async (req, res) => {
	try {
		const userId = req.user._id;

		const shipments = await ExportShipment.find({ userId })
			.sort({ createdAt: -1 })
			.populate("documents")
			.populate("certificateOfOrigin")
			.populate("ucrRequestId", "ucrNumber requestNumber valueInEGP certificationType");

		res.json({
			success: true,
			shipments,
		});
	} catch (error) {
		console.error("Error fetching export shipments:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب شحنات التصدير",
		});
	}
};

/**
 * Get single Export Shipment by ID
 * @route GET /api/export-shipments/:id
 * @access Private (Client/Employee)
 */
const getExportShipmentById = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;
		const userType = req.user.type;

		const shipment = await ExportShipment.findById(id)
			.populate("documents")
			.populate("certificateOfOrigin")
			.populate("form46Document")
			.populate("regulatoryApprovalDocument")
			.populate({
				path: "ucrRequestId",
				select: "requestNumber ucrNumber valueInEGP certificationType uploads shippingMethod destinationCountry destinationPort",
				populate: {
					path: "uploads",
					select: "documentType originalname url filename"
				}
			})
			.populate("userId", "fullname name email phone clientDetails")
			.populate("assignedEmployee", "fullname email")
			.populate("statusHistory.changedBy", "fullname");

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		// Check access - get userId whether populated or not
		const shipmentUserId = shipment.userId?._id?.toString() || shipment.userId?.toString();
		if (userType === "client" && shipmentUserId !== userId.toString()) {
			return res.status(403).json({
				success: false,
				message: "غير مصرح لك بعرض هذه الشحنة",
			});
		}

		// Calculate progress
		const progress = shipment.getProgressPercentage();

		res.json({
			success: true,
			shipment: {
				...shipment.toObject(),
				progressPercentage: progress,
			},
		});
	} catch (error) {
		console.error("Error fetching export shipment:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب شحنة التصدير",
		});
	}
};

/**
 * Add document to Export Shipment
 * @route POST /api/export-shipments/:id/documents
 * @access Private (Client)
 */
const addDocumentToShipment = async (req, res) => {
	try {
		const { id } = req.params;
		const { uploadId } = req.body;
		const userId = req.user._id;

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		// Check ownership
		if (shipment.userId.toString() !== userId.toString()) {
			return res.status(403).json({
				success: false,
				message: "غير مصرح لك بتعديل هذه الشحنة",
			});
		}

		if (!shipment.documents.includes(uploadId)) {
			shipment.documents.push(uploadId);
			await shipment.save();
		}

		res.json({
			success: true,
			message: "تم إضافة المستند بنجاح",
			shipment,
		});
	} catch (error) {
		console.error("Error adding document to shipment:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إضافة المستند",
		});
	}
};

// =====================================================
// EMPLOYEE ENDPOINTS
// =====================================================

/**
 * Get all Export Shipments for employee
 * @route GET /api/export-shipments/employee/all
 * @access Private (Employee)
 */
const getAllExportShipmentsForEmployee = async (req, res) => {
	try {
		const { currentStatus, certificationType, shippingMethod, assignedToMe } = req.query;
		const employeeId = req.user._id;

		const filter = {};
		if (currentStatus) filter.currentStatus = currentStatus;
		if (certificationType) filter.certificationType = certificationType;
		if (shippingMethod) filter.shippingMethod = shippingMethod;
		if (assignedToMe === "true") filter.assignedEmployee = employeeId;

		const shipments = await ExportShipment.find(filter)
			.sort({ createdAt: -1 })
			.populate("userId", "fullname name email phone clientDetails")
			.populate("assignedEmployee", "fullname")
			.populate("ucrRequestId", "ucrNumber requestNumber valueInEGP certificationType");

		res.json({
			success: true,
			shipments,
		});
	} catch (error) {
		console.error("Error fetching export shipments for employee:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب شحنات التصدير",
		});
	}
};

/**
 * Update Export Shipment Status
 * @route PATCH /api/export-shipments/employee/:id/status
 * @access Private (Employee)
 */
const updateExportShipmentStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, notes } = req.body;
		const employeeId = req.user._id;

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		// Validate status transition
		const statusOrder = [
			"documents_verification",
			"regulatory_inspection",
			"payment_cleared",
			"goods_loaded",
			"in_transit",
			"delivered",
			"completed",
		];

		const currentIndex = statusOrder.indexOf(shipment.currentStatus);
		const newIndex = statusOrder.indexOf(status);

		// Allow forward progression only (or same status for notes update)
		if (newIndex < currentIndex && status !== "cancelled") {
			return res.status(400).json({
				success: false,
				message: "لا يمكن الرجوع للحالة السابقة",
			});
		}

		// Add to status history
		shipment.addStatusHistory(status, employeeId, notes);

		await shipment.save();

		res.json({
			success: true,
			message: "تم تحديث حالة الشحنة بنجاح",
			shipment,
		});
	} catch (error) {
		console.error("Error updating export shipment status:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديث حالة الشحنة",
		});
	}
};

/**
 * Assign Employee to Shipment
 * @route POST /api/export-shipments/employee/:id/assign
 * @access Private (Employee)
 */
const assignEmployeeToShipment = async (req, res) => {
	try {
		const { id } = req.params;
		const { employeeId } = req.body;

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		shipment.assignedEmployee = employeeId || req.user._id;
		await shipment.save();

		res.json({
			success: true,
			message: "تم تعيين الموظف بنجاح",
			shipment,
		});
	} catch (error) {
		console.error("Error assigning employee:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تعيين الموظف",
		});
	}
};

/**
 * Add Employee Notes
 * @route PATCH /api/export-shipments/employee/:id/notes
 * @access Private (Employee)
 */
const addEmployeeNotes = async (req, res) => {
	try {
		const { id } = req.params;
		const { notes } = req.body;

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		shipment.employeeNotes = notes;
		await shipment.save();

		res.json({
			success: true,
			message: "تم إضافة الملاحظات بنجاح",
			shipment,
		});
	} catch (error) {
		console.error("Error adding employee notes:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إضافة الملاحظات",
		});
	}
};

/**
 * Request Document from Client
 * @route POST /api/export-shipments/employee/:id/request-document
 * @access Private (Employee)
 */
const requestDocumentFromClient = async (req, res) => {
	try {
		const { id } = req.params;
		const { documentName } = req.body;

		if (!documentName) {
			return res.status(400).json({
				success: false,
				message: "اسم المستند مطلوب",
			});
		}

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		// Check if document already requested
		const existingDoc = shipment.requiredDocuments.find(
			(doc) => doc.name.toLowerCase() === documentName.toLowerCase()
		);

		if (existingDoc) {
			return res.status(400).json({
				success: false,
				message: "تم طلب هذا المستند مسبقاً",
			});
		}

		shipment.requiredDocuments.push({
			name: documentName,
			uploaded: false,
			requestedAt: new Date(),
		});

		await shipment.save();

		// TODO: Send notification to client

		res.json({
			success: true,
			message: "تم طلب المستند من العميل",
			shipment,
		});
	} catch (error) {
		console.error("Error requesting document:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في طلب المستند",
		});
	}
};

/**
 * Upload Required Document (Client responding to request)
 * @route POST /api/export-shipments/:id/upload-required/:docName
 * @access Private (Client)
 */
const uploadRequiredDocument = async (req, res) => {
	try {
		const { id, docName } = req.params;
		const { uploadId } = req.body;
		const userId = req.user._id;

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		// Check ownership
		if (shipment.userId.toString() !== userId.toString()) {
			return res.status(403).json({
				success: false,
				message: "غير مصرح لك بتعديل هذه الشحنة",
			});
		}

		// Find and update the required document
		const docIndex = shipment.requiredDocuments.findIndex(
			(doc) => doc.name.toLowerCase() === docName.toLowerCase()
		);

		if (docIndex === -1) {
			return res.status(404).json({
				success: false,
				message: "المستند المطلوب غير موجود",
			});
		}

		shipment.requiredDocuments[docIndex].uploaded = true;
		shipment.requiredDocuments[docIndex].fileId = uploadId;
		shipment.requiredDocuments[docIndex].uploadedAt = new Date();

		// Also add to documents array
		if (!shipment.documents.includes(uploadId)) {
			shipment.documents.push(uploadId);
		}

		await shipment.save();

		res.json({
			success: true,
			message: "تم رفع المستند بنجاح",
			shipment,
		});
	} catch (error) {
		console.error("Error uploading required document:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في رفع المستند",
		});
	}
};

/**
 * Mark Payment as Cleared
 * @route POST /api/export-shipments/employee/:id/payment-cleared
 * @access Private (Employee)
 */
const markPaymentCleared = async (req, res) => {
	try {
		const { id } = req.params;
		const employeeId = req.user._id;

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		shipment.feePaid = true;
		shipment.paymentDate = new Date();
		shipment.addStatusHistory("payment_cleared", employeeId, "تم السداد");

		await shipment.save();

		res.json({
			success: true,
			message: "تم تأكيد السداد",
			shipment,
		});
	} catch (error) {
		console.error("Error marking payment cleared:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تأكيد السداد",
		});
	}
};

/**
 * Upload Form 46
 * @route POST /api/export-shipments/employee/:id/form-46
 * @access Private (Employee)
 */
const uploadForm46 = async (req, res) => {
	try {
		const { id } = req.params;
		const { form46Number, uploadId } = req.body;

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		if (form46Number) shipment.form46Number = form46Number;
		if (uploadId) shipment.form46Document = uploadId;

		await shipment.save();

		res.json({
			success: true,
			message: "تم إضافة نموذج 46",
			shipment,
		});
	} catch (error) {
		console.error("Error uploading form 46:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إضافة نموذج 46",
		});
	}
};

/**
 * Upload Certificate of Origin
 * @route POST /api/export-shipments/employee/:id/certificate-of-origin
 * @access Private (Employee)
 */
const uploadCertificateOfOrigin = async (req, res) => {
	try {
		const { id } = req.params;
		const { uploadId } = req.body;

		const shipment = await ExportShipment.findById(id);

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		shipment.certificateOfOrigin = uploadId;
		shipment.certificateOfOriginStatus = "issued";

		await shipment.save();

		res.json({
			success: true,
			message: "تم رفع شهادة المنشأ",
			shipment,
		});
	} catch (error) {
		console.error("Error uploading certificate of origin:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في رفع شهادة المنشأ",
		});
	}
};

/**
 * Get Shipment Status History
 * @route GET /api/export-shipments/:id/history
 * @access Private (Client/Employee)
 */
const getShipmentStatusHistory = async (req, res) => {
	try {
		const { id } = req.params;

		const shipment = await ExportShipment.findById(id)
			.select("statusHistory currentStatus")
			.populate("statusHistory.changedBy", "fullname");

		if (!shipment) {
			return res.status(404).json({
				success: false,
				message: "شحنة التصدير غير موجودة",
			});
		}

		res.json({
			success: true,
			currentStatus: shipment.currentStatus,
			history: shipment.statusHistory,
		});
	} catch (error) {
		console.error("Error fetching status history:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب سجل الحالة",
		});
	}
};

module.exports = {
	// Client
	getMyExportShipments,
	getExportShipmentById,
	addDocumentToShipment,
	uploadRequiredDocument,
	// Employee
	getAllExportShipmentsForEmployee,
	updateExportShipmentStatus,
	assignEmployeeToShipment,
	addEmployeeNotes,
	requestDocumentFromClient,
	markPaymentCleared,
	uploadForm46,
	uploadCertificateOfOrigin,
	getShipmentStatusHistory,
};
