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
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.importerName}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Employer Name</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.employerName}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Description</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.shipmentDescription}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Status</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.status}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Expected Arrival</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${new Date(shipmentData.arrivalDate).toLocaleDateString()}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Invoice File</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">
					<a href="${process.env.BASE_URL}${shipmentData.invoiceUrl}" target="_blank" style="color:#0b74de; text-decoration:none;">View Invoice</a>
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

// ✅ تحديث حالة الشحنة
const updateShipmentStatus = async (req, res) => {
	try {
		const { acid } = req.params;
		const updateData = req.body;

		// If file was uploaded, add the file URL to update data
		if (req.file) {
			updateData.invoiceUrl = `/uploads/shipments/${req.file.filename}`;
		}

		const shipment = await Shipment.findOneAndUpdate({ acid }, updateData, {
			new: true,
			runValidators: true,
		});

		if (!shipment)
			return res.status(404).json({ message: "Shipment not found" });

		res.json(shipment);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

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
		const shipments = await Shipment.find({ assignedTo: employeeId });
		res.json(shipments);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
module.exports = {
	createShipment,
	getAllShipments,
	getShipmentByAcid,
	updateShipmentStatus,
	deleteShipment,
	getShipmentStatusByNumber46,
	getShipmentStatusByAcid,
	getShipmentrelatedToEmployee,
};
