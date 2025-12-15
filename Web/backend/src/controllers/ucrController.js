const UCRRequest = require("../models/ucrRequest");
const ExportShipment = require("../models/exportShipment");
const Upload = require("../models/upload");
const { getPresignedUrl } = require("../utils/s3Helpers");

// =====================================================
// CLIENT ENDPOINTS
// =====================================================

/**
 * Create a new UCR Request
 * @route POST /api/ucr
 * @access Private (Client)
 */
const createUCRRequest = async (req, res) => {
	try {
		const userId = req.user._id;

		const {
			certificationType,
			shippingMethod,
			destinationCountry,
			destinationPort,
			generalDescription,
			totalWeight,
			packagesCount,
			valueInEGP,
			originalInvoiceNumber,
			invoiceDate,
			quantity,
			weightUnit,
			containersCount,
			containerWeights,
			items,
			uploads,
			clientNotes,
		} = req.body;

		// Validate required fields
		if (!generalDescription || !totalWeight || !packagesCount || !valueInEGP || !originalInvoiceNumber || !invoiceDate) {
			return res.status(400).json({
				success: false,
				message: "جميع الحقول الإلزامية مطلوبة",
			});
		}

		if (!certificationType || !["noran", "client"].includes(certificationType)) {
			return res.status(400).json({
				success: false,
				message: "نوع الشهادة مطلوب (noran أو client)",
			});
		}

		if (!shippingMethod || !["air", "sea"].includes(shippingMethod)) {
			return res.status(400).json({
				success: false,
				message: "طريقة الشحن مطلوبة (air أو sea)",
			});
		}

		if (!destinationCountry) {
			return res.status(400).json({
				success: false,
				message: "بلد الوجهة مطلوب",
			});
		}

		// Validate sea shipment fields - only require containers if seaShipmentType is 'containers'
		const seaShipmentType = req.body.seaShipmentType;
		if (shippingMethod === "sea" && seaShipmentType === "containers") {
			if (!containersCount || containersCount < 1) {
				return res.status(400).json({
					success: false,
					message: "عدد الحاويات مطلوب للشحن البحري بالحاويات",
				});
			}
		}

		// Generate request number
		const requestNumber = await UCRRequest.generateRequestNumber();

		// Create UCR Request
		const ucrRequest = new UCRRequest({
			userId,
			requestNumber,
			certificationType,
			shippingMethod,
			destinationCountry,
			destinationPort,
			generalDescription,
			totalWeight,
			packagesCount,
			valueInEGP,
			originalInvoiceNumber,
			invoiceDate: new Date(invoiceDate),
			seaShipmentType,
			quantity,
			weightUnit,
			containersCount,
			containerWeights,
			items: items || [],
			uploads: uploads || [],
			clientNotes,
		});

		// Calculate export fee for Noran certified
		if (certificationType === "noran") {
			ucrRequest.calculateExportFee();
		}

		await ucrRequest.save();

		// Populate uploads
		await ucrRequest.populate("uploads");

		res.status(201).json({
			success: true,
			message: "تم إنشاء طلب UCR بنجاح",
			request: ucrRequest,
		});
	} catch (error) {
		console.error("Error creating UCR request:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إنشاء طلب UCR",
			error: error.message,
		});
	}
};

/**
 * Get all UCR Requests for current user (client)
 * @route GET /api/ucr
 * @access Private (Client)
 */
const getMyUCRRequests = async (req, res) => {
	try {
		const userId = req.user._id;

		const requests = await UCRRequest.find({ userId })
			.sort({ requestDate: -1 })
			.populate("uploads")
			.populate("certificateOfOrigin");

		// Generate presigned URLs for uploads in each request
		const requestsWithUrls = await Promise.all(
			requests.map(async (request) => {
				const requestData = request.toObject();
				if (requestData.uploads && requestData.uploads.length > 0) {
					const uploadsWithUrls = await Promise.all(
						requestData.uploads.map(async (upload) => {
							try {
								if (upload.s3Key) {
									const presignedUrl = await getPresignedUrl(upload.s3Key, 3600);
									return { ...upload, url: presignedUrl, presignedUrl };
								}
								return upload;
							} catch (err) {
								console.error(`Error generating presigned URL:`, err.message);
								return upload;
							}
						})
					);
					requestData.uploads = uploadsWithUrls;
				}
				return requestData;
			})
		);

		res.json({
			success: true,
			data: requestsWithUrls,
		});
	} catch (error) {
		console.error("Error fetching UCR requests:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب طلبات UCR",
		});
	}
};

/**
 * Get single UCR Request by ID
 * @route GET /api/ucr/:id
 * @access Private (Client/Employee)
 */
const getUCRRequestById = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;
		const userType = req.user.type;

		const request = await UCRRequest.findById(id)
			.populate("uploads")
			.populate("certificateOfOrigin")
			.populate("regulatoryApprovalDocument")
			.populate("userId", "fullname email phone clientDetails")
			.populate("reviewingBy", "fullname");

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		// Check access (client can only see their own, employees can see all)
		if (userType === "client" && request.userId._id.toString() !== userId.toString()) {
			return res.status(403).json({
				success: false,
				message: "غير مصرح لك بعرض هذا الطلب",
			});
		}

		// Convert to plain object to modify
		const requestData = request.toObject();

		// Generate presigned URLs for uploads
		if (requestData.uploads && requestData.uploads.length > 0) {
			const uploadsWithUrls = await Promise.all(
				requestData.uploads.map(async (upload) => {
					try {
						if (upload.s3Key) {
							const presignedUrl = await getPresignedUrl(upload.s3Key, 3600); // 1 hour
							return {
								...upload,
								url: presignedUrl,
								presignedUrl: presignedUrl,
							};
						}
						return upload;
					} catch (err) {
						console.error(`Error generating presigned URL for upload ${upload._id}:`, err.message);
						return upload; // Return original if presigned URL fails
					}
				})
			);
			requestData.uploads = uploadsWithUrls;
		}

		res.json({
			success: true,
			data: requestData,
		});
	} catch (error) {
		console.error("Error fetching UCR request:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب طلب UCR",
		});
	}
};

/**
 * Update UCR Request (Client can update only if pending)
 * @route PATCH /api/ucr/:id
 * @access Private (Client)
 */
const updateUCRRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		// Check ownership
		if (request.userId.toString() !== userId.toString()) {
			return res.status(403).json({
				success: false,
				message: "غير مصرح لك بتعديل هذا الطلب",
			});
		}

		// Check if editable (only pending requests)
		if (request.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "لا يمكن تعديل الطلب بعد بدء المعالجة",
			});
		}

		// Update allowed fields
		const updateFields = [
			"destinationCountry",
			"destinationPort",
			"generalDescription",
			"totalWeight",
			"packagesCount",
			"valueInEGP",
			"originalInvoiceNumber",
			"invoiceDate",
			"quantity",
			"weightUnit",
			"containersCount",
			"containerWeights",
			"seaShipmentType",
			"items",
			"uploads",
			"clientNotes",
		];

		updateFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				request[field] = req.body[field];
			}
		});

		// Recalculate fee if value changed
		if (req.body.valueInEGP !== undefined) {
			request.calculateExportFee();
		}

		await request.save();

		res.json({
			success: true,
			message: "تم تحديث طلب UCR بنجاح",
			request,
		});
	} catch (error) {
		console.error("Error updating UCR request:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديث طلب UCR",
		});
	}
};

/**
 * Delete UCR Request (Client can delete only if pending)
 * @route DELETE /api/ucr/:id
 * @access Private (Client)
 */
const deleteUCRRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		// Check ownership
		if (request.userId.toString() !== userId.toString()) {
			return res.status(403).json({
				success: false,
				message: "غير مصرح لك بحذف هذا الطلب",
			});
		}

		// Check if deletable
		if (request.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "لا يمكن حذف الطلب بعد بدء المعالجة",
			});
		}

		await UCRRequest.findByIdAndDelete(id);

		res.json({
			success: true,
			message: "تم حذف طلب UCR بنجاح",
		});
	} catch (error) {
		console.error("Error deleting UCR request:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في حذف طلب UCR",
		});
	}
};

// =====================================================
// EMPLOYEE ENDPOINTS
// =====================================================

/**
 * Get all UCR Requests for employee
 * @route GET /api/ucr/employee/all
 * @access Private (Employee)
 */
const getAllUCRRequestsForEmployee = async (req, res) => {
	try {
		const { status, certificationType, shippingMethod } = req.query;

		const filter = {};
		if (status) filter.status = status;
		if (certificationType) filter.certificationType = certificationType;
		if (shippingMethod) filter.shippingMethod = shippingMethod;

		const requests = await UCRRequest.find(filter)
			.sort({ requestDate: -1 })
			.populate("userId", "fullname email phone clientDetails")
			.populate("uploads")
			.populate("reviewingBy", "fullname");

		// Generate presigned URLs for uploads in each request
		const requestsWithUrls = await Promise.all(
			requests.map(async (request) => {
				const requestData = request.toObject();
				if (requestData.uploads && requestData.uploads.length > 0) {
					const uploadsWithUrls = await Promise.all(
						requestData.uploads.map(async (upload) => {
							try {
								if (upload.s3Key) {
									const presignedUrl = await getPresignedUrl(upload.s3Key, 3600);
									return { ...upload, url: presignedUrl, presignedUrl };
								}
								return upload;
							} catch (err) {
								console.error(`Error generating presigned URL:`, err.message);
								return upload;
							}
						})
					);
					requestData.uploads = uploadsWithUrls;
				}
				return requestData;
			})
		);

		res.json({
			success: true,
			data: requestsWithUrls,
		});
	} catch (error) {
		console.error("Error fetching UCR requests for employee:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في جلب طلبات UCR",
		});
	}
};

/**
 * Lock UCR Request for review
 * @route POST /api/ucr/employee/:id/lock
 * @access Private (Employee)
 */
const lockUCRRequest = async (req, res) => {
	try {
		const { id } = req.params;
		const employeeId = req.user._id;

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		if (request.isLocked && request.reviewingBy?.toString() !== employeeId.toString()) {
			return res.status(400).json({
				success: false,
				message: "هذا الطلب قيد المراجعة من قبل موظف آخر",
			});
		}

		request.isLocked = true;
		request.reviewingBy = employeeId;
		request.reviewStartedAt = new Date();

		await request.save();

		res.json({
			success: true,
			message: "تم قفل الطلب للمراجعة",
			request,
		});
	} catch (error) {
		console.error("Error locking UCR request:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في قفل الطلب",
		});
	}
};

/**
 * Unlock UCR Request
 * @route POST /api/ucr/employee/:id/unlock
 * @access Private (Employee)
 */
const unlockUCRRequest = async (req, res) => {
	try {
		const { id } = req.params;

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		request.isLocked = false;
		request.reviewingBy = null;
		request.reviewStartedAt = null;

		await request.save();

		res.json({
			success: true,
			message: "تم فتح الطلب",
			request,
		});
	} catch (error) {
		console.error("Error unlocking UCR request:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في فتح الطلب",
		});
	}
};

/**
 * Issue UCR Number and Create Export Shipment
 * @route POST /api/ucr/employee/:id/issue-ucr
 * @access Private (Employee)
 */
const issueUCRNumber = async (req, res) => {
	try {
		const { id } = req.params;
		const { ucrNumber } = req.body;
		const employeeId = req.user._id;

		if (!ucrNumber) {
			return res.status(400).json({
				success: false,
				message: "رقم UCR مطلوب",
			});
		}

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		// Allow issuance from pending or approved status
		if (!["pending", "approved", "under_review"].includes(request.status)) {
			return res.status(400).json({
				success: false,
				message: "لا يمكن إصدار UCR لهذا الطلب - الحالة الحالية: " + request.status,
			});
		}

		request.ucrNumber = ucrNumber;
		request.status = "ucr_issued";
		request.ucrIssuedAt = new Date();

		await request.save();

		// Auto-create Export Shipment if not already created
		let exportShipment = null;
		if (!request.hasExportShipment) {
			try {
				const shipmentNumber = await ExportShipment.generateShipmentNumber(request.shippingMethod);

				exportShipment = new ExportShipment({
					userId: request.userId,
					ucrRequestId: request._id,
					shipmentNumber,
					ucrNumber: ucrNumber,
					certificationType: request.certificationType,
					shippingMethod: request.shippingMethod,
					destinationCountry: request.destinationCountry,
					destinationPort: request.destinationPort,
					generalDescription: request.generalDescription,
					items: request.items,
					totalWeight: request.totalWeight,
					packagesCount: request.packagesCount,
					valueInEGP: request.valueInEGP,
					containersCount: request.containersCount,
					containerWeights: request.containerWeights,
					exportFee: request.exportFee,
					serviceFees: request.serviceFees,
					totalFees: request.totalFees,
					regulatoryBody: request.regulatoryBody,
					form46Number: request.customsEntryNumber46,
					assignedEmployee: employeeId,
					certificateOfOriginStatus: request.certificationType === "noran" ? "pending" : "not_required",
					certificateIssuedBy: request.certificationType,
					currentStatus: "documents_verification", // Explicitly set initial status
					statusHistory: [{
						status: "documents_verification",
						changedAt: new Date(),
						changedBy: employeeId,
						notes: "تم إنشاء شحنة التصدير"
					}]
				});

				await exportShipment.save();

				// Update UCR Request with shipment info
				request.hasExportShipment = true;
				request.exportShipmentId = exportShipment._id;
				request.exportShipmentCreatedAt = new Date();

				await request.save();
			} catch (shipmentError) {
				console.error("Error creating export shipment:", shipmentError);
				// Continue even if shipment creation fails
			}
		}

		res.json({
			success: true,
			message: exportShipment 
				? "تم إصدار رقم UCR وإنشاء شحنة التصدير بنجاح" 
				: "تم إصدار رقم UCR بنجاح",
			request,
			shipment: exportShipment,
		});
	} catch (error) {
		console.error("Error issuing UCR number:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إصدار رقم UCR",
		});
	}
};

/**
 * Update UCR Status by Employee
 * @route PATCH /api/ucr/employee/:id/status
 * @access Private (Employee)
 */
const updateUCRStatusByEmployee = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, employeeNotes, regulatoryBody, customsEntryNumber46, rejectionReason } = req.body;

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		// Validate status transition
		const validTransitions = {
			pending: ["under_review", "approved", "rejected", "needs_revision"],
			under_review: ["approved", "rejected", "needs_revision", "ucr_issued"],
			needs_revision: ["pending", "under_review", "approved", "rejected"],
			ucr_issued: ["documents_prepared", "awaiting_regulatory_approval", "customs_entry_46"],
			documents_prepared: ["awaiting_regulatory_approval", "customs_entry_46"],
			awaiting_regulatory_approval: ["customs_entry_46"],
			customs_entry_46: ["ready_to_ship"],
			ready_to_ship: ["certificate_of_origin_pending"],
			certificate_of_origin_pending: ["completed"],
			approved: ["ucr_issued", "completed"],
		};

		if (status && validTransitions[request.status] && !validTransitions[request.status].includes(status)) {
			return res.status(400).json({
				success: false,
				message: `لا يمكن الانتقال من ${request.status} إلى ${status}`,
			});
		}

		// Update fields
		if (status) {
			request.status = status;
			
			// Set timestamps based on status
			if (status === "documents_prepared") {
				request.documentsReadyAt = new Date();
			} else if (status === "ready_to_ship") {
				request.readyToShipAt = new Date();
			} else if (status === "completed") {
				request.completedAt = new Date();
				request.isLocked = false;
				request.reviewingBy = null;
			}
		}

		if (employeeNotes) request.employeeNotes = employeeNotes;
		if (regulatoryBody) request.regulatoryBody = regulatoryBody;
		if (customsEntryNumber46) request.customsEntryNumber46 = customsEntryNumber46;
		if (rejectionReason) request.rejectionReason = rejectionReason;

		await request.save();

		res.json({
			success: true,
			message: "تم تحديث حالة الطلب بنجاح",
			request,
		});
	} catch (error) {
		console.error("Error updating UCR status:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديث حالة الطلب",
		});
	}
};

/**
 * Upload Certificate of Origin
 * @route POST /api/ucr/employee/:id/certificate-of-origin
 * @access Private (Employee)
 */
const uploadCertificateOfOrigin = async (req, res) => {
	try {
		const { id } = req.params;
		const { uploadId } = req.body;

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		// Check if can upload certificate
		const canUpload = request.canUploadCertificateOfOrigin();
		if (!canUpload.allowed) {
			return res.status(400).json({
				success: false,
				message: canUpload.reason,
			});
		}

		request.certificateOfOrigin = uploadId;
		request.certificateOfOriginUploadedAt = new Date();
		request.status = "completed";
		request.completedAt = new Date();
		request.isLocked = false;
		request.reviewingBy = null;

		await request.save();

		res.json({
			success: true,
			message: "تم رفع شهادة المنشأ بنجاح",
			request,
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
 * Set Regulatory Body
 * @route POST /api/ucr/employee/:id/regulatory-body
 * @access Private (Employee)
 */
const setRegulatoryBody = async (req, res) => {
	try {
		const { id } = req.params;
		const { regulatoryBody, approvalUploadId } = req.body;

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		request.regulatoryBody = regulatoryBody;
		
		if (approvalUploadId) {
			request.regulatoryApprovalDocument = approvalUploadId;
			request.regulatoryApprovalDate = new Date();
		}

		if (regulatoryBody && request.status === "ucr_issued" || request.status === "documents_prepared") {
			request.status = "awaiting_regulatory_approval";
		}

		await request.save();

		res.json({
			success: true,
			message: "تم تحديد الجهة الرقابية بنجاح",
			request,
		});
	} catch (error) {
		console.error("Error setting regulatory body:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديد الجهة الرقابية",
		});
	}
};

/**
 * Create Export Shipment from UCR Request
 * @route POST /api/ucr/employee/:id/create-shipment
 * @access Private (Employee)
 */
const createExportShipmentFromUCR = async (req, res) => {
	try {
		const { id } = req.params;
		const employeeId = req.user._id;

		const ucrRequest = await UCRRequest.findById(id);

		if (!ucrRequest) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		if (!ucrRequest.ucrNumber) {
			return res.status(400).json({
				success: false,
				message: "يجب إصدار رقم UCR أولاً",
			});
		}

		if (ucrRequest.hasExportShipment) {
			return res.status(400).json({
				success: false,
				message: "تم إنشاء شحنة تصدير لهذا الطلب مسبقاً",
			});
		}

		// Generate shipment number
		const shipmentNumber = await ExportShipment.generateShipmentNumber(ucrRequest.shippingMethod);

		// Create export shipment
		const exportShipment = new ExportShipment({
			userId: ucrRequest.userId,
			ucrRequestId: ucrRequest._id,
			shipmentNumber,
			ucrNumber: ucrRequest.ucrNumber,
			certificationType: ucrRequest.certificationType,
			shippingMethod: ucrRequest.shippingMethod,
			destinationCountry: ucrRequest.destinationCountry,
			destinationPort: ucrRequest.destinationPort,
			generalDescription: ucrRequest.generalDescription,
			items: ucrRequest.items,
			totalWeight: ucrRequest.totalWeight,
			packagesCount: ucrRequest.packagesCount,
			valueInEGP: ucrRequest.valueInEGP,
			containersCount: ucrRequest.containersCount,
			containerWeights: ucrRequest.containerWeights,
			exportFee: ucrRequest.exportFee,
			serviceFees: ucrRequest.serviceFees,
			totalFees: ucrRequest.totalFees,
			regulatoryBody: ucrRequest.regulatoryBody,
			form46Number: ucrRequest.customsEntryNumber46,
			assignedEmployee: employeeId,
			certificateOfOriginStatus: ucrRequest.certificationType === "noran" ? "pending" : "not_required",
			certificateIssuedBy: ucrRequest.certificationType,
			currentStatus: "documents_verification", // Explicitly set initial status
			statusHistory: [{
				status: "documents_verification",
				changedAt: new Date(),
				changedBy: employeeId,
				notes: "تم إنشاء شحنة التصدير"
			}]
		});

		await exportShipment.save();

		// Update UCR Request
		ucrRequest.hasExportShipment = true;
		ucrRequest.exportShipmentId = exportShipment._id;
		ucrRequest.exportShipmentCreatedAt = new Date();

		await ucrRequest.save();

		res.status(201).json({
			success: true,
			message: "تم إنشاء شحنة التصدير بنجاح",
			shipment: exportShipment,
		});
	} catch (error) {
		console.error("Error creating export shipment:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إنشاء شحنة التصدير",
		});
	}
};

/**
 * Update document status (Employee review a specific document)
 * @route PATCH /api/ucr/employee/:id/document/:uploadId/status
 * @access Private (Employee)
 */
const updateDocumentStatus = async (req, res) => {
	try {
		const { id, uploadId } = req.params;
		const { status, employeeNotes } = req.body;
		const employeeId = req.user._id;

		if (!status || !["pending", "approved", "rejected", "needs_revision"].includes(status)) {
			return res.status(400).json({
				success: false,
				message: "حالة المستند غير صالحة",
			});
		}

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		// Find if document status already exists
		const existingIndex = request.documentStatuses.findIndex(
			(ds) => ds.uploadId?.toString() === uploadId
		);

		if (existingIndex !== -1) {
			// Update existing
			request.documentStatuses[existingIndex].status = status;
			request.documentStatuses[existingIndex].employeeNotes = employeeNotes || "";
			request.documentStatuses[existingIndex].reviewedBy = employeeId;
			request.documentStatuses[existingIndex].reviewedAt = new Date();
		} else {
			// Add new
			request.documentStatuses.push({
				uploadId,
				status,
				employeeNotes: employeeNotes || "",
				reviewedBy: employeeId,
				reviewedAt: new Date(),
			});
		}

		await request.save();
		await request.populate("documentStatuses.reviewedBy", "fullname");

		res.json({
			success: true,
			message: status === "approved" ? "تمت الموافقة على المستند" : 
			         status === "rejected" ? "تم رفض المستند" : 
			         "تم تحديث حالة المستند",
			documentStatuses: request.documentStatuses,
		});
	} catch (error) {
		console.error("Error updating document status:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في تحديث حالة المستند",
		});
	}
};

/**
 * Employee add document to UCR request
 * @route POST /api/ucr/employee/:id/add-document
 * @access Private (Employee)
 */
const employeeAddDocument = async (req, res) => {
	try {
		const { id } = req.params;
		const { uploadId, documentType } = req.body;
		const employeeId = req.user._id;

		const request = await UCRRequest.findById(id);

		if (!request) {
			return res.status(404).json({
				success: false,
				message: "طلب UCR غير موجود",
			});
		}

		// Add upload to request
		if (!request.uploads.includes(uploadId)) {
			request.uploads.push(uploadId);
		}

		// Add document status as approved (since employee added it)
		const existingIndex = request.documentStatuses.findIndex(
			(ds) => ds.uploadId?.toString() === uploadId
		);

		if (existingIndex === -1) {
			request.documentStatuses.push({
				uploadId,
				documentType,
				status: "approved",
				employeeNotes: "تم إضافته بواسطة الموظف",
				reviewedBy: employeeId,
				reviewedAt: new Date(),
			});
		}

		await request.save();
		await request.populate("uploads");

		res.json({
			success: true,
			message: "تم إضافة المستند بنجاح",
			uploads: request.uploads,
		});
	} catch (error) {
		console.error("Error adding document:", error);
		res.status(500).json({
			success: false,
			message: "خطأ في إضافة المستند",
		});
	}
};

module.exports = {
	// Client
	createUCRRequest,
	getMyUCRRequests,
	getUCRRequestById,
	updateUCRRequest,
	deleteUCRRequest,
	// Employee
	getAllUCRRequestsForEmployee,
	lockUCRRequest,
	unlockUCRRequest,
	issueUCRNumber,
	updateUCRStatusByEmployee,
	uploadCertificateOfOrigin,
	setRegulatoryBody,
	createExportShipmentFromUCR,
	updateDocumentStatus,
	employeeAddDocument,
};
