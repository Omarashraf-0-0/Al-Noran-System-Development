const Shipment = require("../models/shipment");
const mailSender = require("../services/mailer");
const jwt = require("jsonwebtoken");

// ✅ إنشاء شحنة جديدة
const createShipment = async (req, res) => {
	try {
		const token = req.body.token || req.headers.authorization?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const shipmentData = req.body;

		// Ensure invoice file exists
		if (req.file) {
			shipmentData.invoiceUrl = `/uploads/shipments/${req.file.filename}`;
		} else {
			// hash this when tetsing with no invoice file
			return res.status(400).json({ message: "Invoice file is required" });
		}

		console.log("Final shipment data to be saved:", shipmentData);

		// Save shipment in DB
		const shipment = new Shipment(shipmentData);
		await shipment.save();

		// Generate unique ACID request ID (example)
		const ACID_ID = `ACID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		shipment.acidId = ACID_ID;
		await shipment.save();

		const htmlContent = `
			<!doctype html>
			<html>
			<head>
			<meta charset="utf-8">
			<title>Shipment Request Confirmation</title>
			</head>
			<body style="font-family:Arial, sans-serif; background:#f5f7fa; padding:20px;">
			<div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:10px; box-shadow:0 0 8px rgba(0,0,0,0.1);">
				<h2 style="color:#0b74de; text-align:center;">📦 Shipment Request Confirmation</h2>
				<p>Hello <strong>${decoded.username || decoded.email}</strong>,</p>
				<p>Thank you for submitting your shipment request. Below are your shipment details:</p>

				<table style="width:100%; border-collapse:collapse; margin-top:15px;">
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>ACID Request ID</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.acid}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Importer Name</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${
						shipmentData.importerName
					}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Employer Name</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${
						shipmentData.employerName
					}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Description</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${
						shipmentData.shipmentDescription
					}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Status</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.status}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Expected Arrival</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${new Date(
						shipmentData.arrivalDate
					).toLocaleDateString()}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Invoice File</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">
					<a href="${process.env.BASE_URL}${
			shipmentData.invoiceUrl
		}" target="_blank" style="color:#0b74de; text-decoration:none;">View Invoice</a>
					</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Submitted At</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${new Date().toLocaleString()}</td>
				</tr>
				</table>

				<p style="margin-top:20px;">Your shipment request is currently being processed. You can track its progress using the ACID Request ID above.</p>

				<p style="margin-top:25px;">Best regards,<br><strong>LogiShip Support Team</strong></p>

				<hr style="margin-top:30px; border:none; border-top:1px solid #eee;">
				<p style="font-size:12px; color:#888; text-align:center;">This is an automated message — please do not reply.</p>
			</div>
			</body>
			</html>
			`;

		// 🧠 Send the email
		await mailSender.send_mail(
			decoded.email,
			`Shipment Confirmation – ${ACID_ID}`,
			htmlContent
		);

		// ✅ Respond to client
		res.status(201).json({
			success: true,
			message: "Shipment created successfully. Confirmation email sent.",
			data: shipment,
		});
	} catch (error) {
		console.error("Error creating shipment:", error);
		res.status(400).json({ message: error.message });
	}
};

// ✅ جلب كل الشحنات
const getAllShipments = async (req, res) => {
	try {
		const shipments = await Shipment.find().sort({ createdAt: -1 });
		res.json(shipments);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ جلب شحنة بالـ ACID
const getShipmentByAcid = async (req, res) => {
	try {
		const shipment = await Shipment.findOne({ acid: req.params.acid });
		if (!shipment)
			return res.status(404).json({ message: "Shipment not found" });
		res.json(shipment);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ جلب شحنة بالـ ID
const getShipmentById = async (req, res) => {
	try {
		const shipment = await Shipment.findById(req.params.shipmentId);
		if (!shipment)
			return res.status(404).json({ message: "Shipment not found" });
		res.json(shipment);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// ✅ تحديث حالة الشحنة
// (افترض أن هذا الكود داخل ملف controllers/shipmentController.js)

// (تأكد من استيراد الموديل الخاص بك، مثلاً: const Shipment = require('../models/Shipment');)

const updateShipmentStatus = async (req, res) => {
	try {
		const { acid } = req.params;
		const updateData = req.body;

		if (req.file) {
			updateData.invoiceUrl = `/uploads/shipments/${req.file.filename}`;
		}

		// (هنا يتم تحديث الداتا بيز)
		const shipment = await Shipment.findOneAndUpdate({ acid }, updateData, {
			new: true, // (مهم جداً لإرجاع الداتا بعد التحديث)
			runValidators: true,
		});

		if (!shipment)
			return res.status(404).json({ message: "Shipment not found" });

		if (updateData.status) {
			const { io } = req;
			io.to(acid).emit("shipmentStatusUpdate", {
				acid: acid,
				status: shipment.status,
			});
			console.log(
				`Socket event emitted for ACID: ${acid} with status: ${shipment.status}`
			);
		}

		res.json(shipment); // إرسال الرد الطبيعي للـ API
	} catch (error) {
		console.error("Error in updateShipmentStatus:", error); // (يفضل طباعة الخطأ)
		res.status(500).json({ message: error.message });
	}
};

// (تأكد من عمل export للدالة)
// module.exports = { updateShipmentStatus, ... };

// ✅ حذف شحنة
const deleteShipment = async (req, res) => {
	try {
		const shipment = await Shipment.findOneAndDelete({ acid: req.params.acid });
		if (!shipment)
			return res.status(404).json({ message: "Shipment not found" });
		res.json({ message: "Shipment deleted successfully" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
// Get shimpment status by ACID
const getShipmentStatusByAcid = async (req, res) => {
	try {
		const shipment = await Shipment.findOne({ acid: req.params.acid });
		if (!shipment)
			return res.status(404).json({ message: "Shipment not found" });
		res.json({ status: shipment.status });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
// get shipment status by number46
const getShipmentStatusByNumber46 = async (req, res) => {
	try {
		const shipment = await Shipment.findOne({ number46: req.params.number46 });
		if (!shipment)
			return res.status(404).json({ message: "Shipment not found" });
		res.json({ status: shipment.status });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
const getShipmentrelatedToEmployee = async (req, res) => {
	try {
		const employeeId = req.params.employeeId;
		console.log("Fetching shipments for employee:", employeeId);

		const shipments = await Shipment.find({ employee_id: employeeId }).sort({
			createdAt: -1,
		});

		console.log(
			`Found ${shipments.length} shipments for employee ${employeeId}`
		);
		res.json(shipments);
	} catch (error) {
		console.error("Error fetching shipments:", error);
		res.status(500).json({ message: error.message });
	}
};

// ✅ Get shipments related to a client/user
const getShipmentsByUserId = async (req, res) => {
	try {
		const userId = req.params.userId;
		console.log("Fetching shipments for user:", userId);

		const shipments = await Shipment.find({ user_id: userId }).sort({
			createdAt: -1,
		});

		console.log(
			`Found ${shipments.length} shipments for user ${userId}`
		);
		res.json(shipments);
	} catch (error) {
		console.error("Error fetching user shipments:", error);
		res.status(500).json({ message: error.message });
	}
};

const addShipments = async (req, res) => {
	const shipmentsData = req.body;

	if (!Array.isArray(shipmentsData)) {
		return res.status(400).json({ message: "Expected an array of shipments" });
	}
	try {
		const shipments = await Shipment.insertMany(shipmentsData, {
			ordered: false,
		});

		res.status(201).json({
			message: `${shipments.length} shipments saved successfully`,
			shipments,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to save shipments" });
	}
};

// ✅ Update shipment status by ID (for employees)
const updateShipmentStatusById = async (req, res) => {
	try {
		const { shipmentId } = req.params;
		const { status } = req.body;

		// Validate status
		const validStatuses = [
			"In Transit",
			"في انتظار الشحن",
			"في انتظار وصول الإذن",
			"جاري الكشف والتثمين",
			"تمت بنجاح",
			"Pending",
			"Arrived",
			"Customs Clearance",
			"Completed",
		];

		if (!status) {
			return res.status(400).json({ message: "Status is required" });
		}

		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				message: "Invalid status value",
				validStatuses,
			});
		}

		// Find and update shipment
		const shipment = await Shipment.findByIdAndUpdate(
			shipmentId,
			{ status },
			{ new: true, runValidators: true }
		);

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		// Emit socket event for real-time updates
		if (req.io) {
			req.io.to(shipment.acid).emit("shipmentStatusUpdate", {
				shipmentId: shipment._id,
				acid: shipment.acid,
				status: shipment.status,
				updatedAt: new Date(),
			});
			console.log(
				`Socket event emitted for shipment ID: ${shipmentId} with status: ${status}`
			);
		}

		// TODO: Send email/notification to client about status change
		// You can add email notification here using mailSender service

		res.json({
			success: true,
			message: "Shipment status updated successfully",
			data: shipment,
		});
	} catch (error) {
		console.error("Error updating shipment status:", error);
		res.status(500).json({ message: error.message });
	}
};

// ✅ Request required documents from client
const requestRequiredDocuments = async (req, res) => {
	try {
		const { shipmentId } = req.params;
		const { documents } = req.body;

		// Validate input
		if (!documents || !Array.isArray(documents) || documents.length === 0) {
			return res.status(400).json({
				message: "Documents array is required and must not be empty",
			});
		}

		// Find shipment
		const shipment = await Shipment.findById(shipmentId).populate(
			"user_id",
			"email username fullname"
		);

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		// Store required documents in shipment
		const formattedDocuments = documents.map(doc => ({
			name: doc.name || doc,
			uploaded: false,
			requestedAt: new Date()
		}));
		
		shipment.requiredDocuments = [
			...(shipment.requiredDocuments || []),
			...formattedDocuments
		];
		
		await shipment.save();

		// Prepare email content
		const documentsList = documents
			.map((doc) => `<li style="padding:5px 0;">${doc.name || doc}</li>`)
			.join("");

		const htmlContent = `
			<!doctype html>
			<html>
			<head>
			<meta charset="utf-8">
			<title>Required Documents Request</title>
			</head>
			<body style="font-family:Arial, sans-serif; background:#f5f7fa; padding:20px;">
			<div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:10px; box-shadow:0 0 8px rgba(0,0,0,0.1);">
				<h2 style="color:#dc2626; text-align:center;">📄 مستندات مطلوبة لشحنتك</h2>
				<p>مرحباً <strong>${
					shipment.user_id?.username ||
					shipment.user_id?.fullname ||
					"عزيزي العميل"
				}</strong>,</p>
				<p>نود إعلامك بأننا نحتاج إلى المستندات التالية لاستكمال معالجة شحنتك:</p>

				<div style="background:#fef2f2; border-right:4px solid #dc2626; padding:15px; margin:20px 0; border-radius:5px;">
					<h3 style="color:#dc2626; margin-top:0;">تفاصيل الشحنة:</h3>
					<p style="margin:5px 0;"><strong>رقم ACID:</strong> ${shipment.acid}</p>
					<p style="margin:5px 0;"><strong>رقم البوليصة:</strong> ${
						shipment.number46 || "غير محدد"
					}</p>
					<p style="margin:5px 0;"><strong>الحالة الحالية:</strong> ${shipment.status}</p>
				</div>

				<h3 style="color:#dc2626;">المستندات المطلوبة:</h3>
				<ul style="background:#f9fafb; padding:20px 40px; border-radius:5px; list-style:none;">
					${documentsList}
				</ul>

				<div style="background:#fef3c7; border:1px solid #fbbf24; padding:15px; margin:20px 0; border-radius:5px; text-align:center;">
					<p style="margin:0; color:#92400e;"><strong>⚠️ مهم:</strong> يرجى رفع المستندات المطلوبة في أقرب وقت ممكن لتجنب أي تأخير في معالجة شحنتك.</p>
				</div>

				<div style="text-align:center; margin-top:30px;">
					<a href="${
						process.env.FRONTEND_URL ||
						"http://section-assignment-bucket.s3-website-us-east-1.amazonaws.com"
					}/shipmentstatus/${shipment.acid}" 
					   style="display:inline-block; background:#dc2626; color:#ffffff; padding:12px 30px; text-decoration:none; border-radius:8px; font-weight:bold;">
						رفع المستندات الآن
					</a>
				</div>

				<p style="margin-top:25px;">إذا كانت لديك أي أسئلة، يرجى التواصل مع فريق الدعم.</p>

				<p style="margin-top:25px;">مع أطيب التحيات،<br><strong>فريق الدعم - النوران</strong></p>

				<hr style="margin-top:30px; border:none; border-top:1px solid #eee;">
				<p style="font-size:12px; color:#888; text-align:center;">هذه رسالة آلية - يرجى عدم الرد عليها مباشرة.</p>
			</div>
			</body>
			</html>
		`;

		// Send email notification to client
		const clientEmail = shipment.user_id?.email;
		if (clientEmail) {
			await mailSender.send_mail(
				clientEmail,
				`مستندات مطلوبة - شحنة ${shipment.acid}`,
				htmlContent
			);
		}

		// Emit socket event for real-time notification
		if (req.io) {
			req.io.to(shipment.acid).emit("documentsRequested", {
				shipmentId: shipment._id,
				acid: shipment.acid,
				documents: documents,
				requestedAt: new Date(),
			});
			console.log(
				`Documents request notification sent for shipment: ${shipment.acid}`
			);
		}

		res.json({
			success: true,
			message: "Required documents request sent successfully",
			data: {
				shipmentId: shipment._id,
				acid: shipment.acid,
				documentsRequested: documents,
				notificationSent: !!clientEmail,
			},
		});
	} catch (error) {
		console.error("Error requesting required documents:", error);
		res.status(500).json({ message: error.message });
	}
};

// ✅ Get required documents for a shipment
const getRequiredDocuments = async (req, res) => {
	try {
		const { shipmentId } = req.params;

		const shipment = await Shipment.findById(shipmentId).select('requiredDocuments acid');

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		res.json({
			success: true,
			data: {
				shipmentId: shipment._id,
				acid: shipment.acid,
				requiredDocuments: shipment.requiredDocuments || []
			}
		});
	} catch (error) {
		console.error("Error fetching required documents:", error);
		res.status(500).json({ message: error.message });
	}
};

// ✅ Mark document as uploaded
const markDocumentAsUploaded = async (req, res) => {
	try {
		const { shipmentId, documentId } = req.params;
		const { fileId } = req.body;

		const shipment = await Shipment.findById(shipmentId);

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		const document = shipment.requiredDocuments.id(documentId);

		if (!document) {
			return res.status(404).json({ message: "Document not found" });
		}

		document.uploaded = true;
		document.uploadedAt = new Date();
		if (fileId) {
			document.fileId = fileId;
		}

		await shipment.save();

		// Emit socket event
		if (req.io) {
			req.io.to(shipment.acid).emit("documentUploaded", {
				shipmentId: shipment._id,
				acid: shipment.acid,
				documentId: documentId,
				documentName: document.name
			});
		}

		res.json({
			success: true,
			message: "Document marked as uploaded successfully",
			data: document
		});
	} catch (error) {
		console.error("Error marking document as uploaded:", error);
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	createShipment,
	getAllShipments,
	getShipmentByAcid,
	getShipmentById,
	updateShipmentStatus,
	deleteShipment,
	getShipmentStatusByNumber46,
	getShipmentStatusByAcid,
	getShipmentrelatedToEmployee,
	getShipmentsByUserId,
	addShipments,
	updateShipmentStatusById,
	requestRequiredDocuments,
	getRequiredDocuments,
	markDocumentAsUploaded,
};
