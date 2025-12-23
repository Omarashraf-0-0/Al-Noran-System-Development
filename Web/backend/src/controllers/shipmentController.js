const Shipment = require("../models/shipment");
const Invoice = require("../models/invoice");
const Upload = require("../models/upload");
const mailSender = require("../services/mailer");
const jwt = require("jsonwebtoken");
const notificationService = require("../services/notificationService");
const s3Helpers = require("../utils/s3Helpers");

// ✅ إنشاء شحنة جديدة
const createShipment = async (req, res) => {
	try {
		const token = req.body.token || req.headers.authorization?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const shipmentData = req.body;

		console.log("🔐 Decoded token:", decoded);
		console.log("👤 User type check:", decoded.type, decoded.userType);
		console.log("📦 Shipment data employee_id:", shipmentData.employee_id);

		// Check if this is an employee creating the shipment
		const isEmployee =
			decoded.type === "employee" ||
			decoded.userType === "employee" ||
			shipmentData.employee_id; // If employee_id is provided, it's an employee creating it

		// Handle invoice file
		if (req.file) {
			// New file uploaded
			shipmentData.invoiceUrl = `/uploads/shipments/${req.file.filename}`;
		} else if (isEmployee) {
			// Employee creating shipment - invoice comes from ACID request uploads
			console.log("👨‍💼 Employee creating shipment, checking uploads...");

			// Find invoice from uploads array if provided
			if (shipmentData.uploads && Array.isArray(shipmentData.uploads)) {
				console.log("📎 Uploads array:", shipmentData.uploads);
				const invoiceUpload = shipmentData.uploads.find(
					(upload) =>
						upload.category === "invoice" ||
						upload.documentType === "proforma_invoice"
				);
				if (invoiceUpload && invoiceUpload.s3Url) {
					shipmentData.invoiceUrl = invoiceUpload.s3Url;
					console.log("✅ Invoice URL found:", shipmentData.invoiceUrl);
				}
			}
			// If no invoice found in uploads, it can be added later
			if (!shipmentData.invoiceUrl) {
				console.log(
					"⚠️ No invoice found, setting to null (can be added later)"
				);
				shipmentData.invoiceUrl = null;
			}
		} else {
			// Client must provide invoice file
			console.log("❌ Client creating shipment without file");
			return res.status(400).json({ message: "Invoice file is required" });
		}

		console.log("Final shipment data before mapping:", shipmentData);

		// Map frontend field names to database schema
		const mappedShipmentData = {
			user_id: shipmentData.user_id,
			employee_id: shipmentData.employee_id,
			acid: shipmentData.acid,
			shipment_type:
				shipmentData.shipment_type || shipmentData.shipmentType || "بحري",
			port_name: shipmentData.port_name || shipmentData.portName,
			country: shipmentData.country,
			num_of_containers:
				shipmentData.num_of_containers || shipmentData.numContainers || 1,
			type_of_containers:
				Array.isArray(shipmentData.type_of_containers)
					? shipmentData.type_of_containers.map(i => (typeof i === 'object' && i.type) ? i.type : i)
					: (Array.isArray(shipmentData.containerTypes)
						? shipmentData.containerTypes.map(i => (typeof i === 'object' && i.type) ? i.type : i)
						: []),
			status: shipmentData.status || "Pending",
			policy: shipmentData.policy || "",
			arrivalDate: shipmentData.arrivalDate,
			invoiceUrl: shipmentData.invoiceUrl,
			acid_request_id: shipmentData.acid_request_id,
			uploads: shipmentData.uploads || [],
			// Legacy fields for display
			importerName: shipmentData.importerName || "",
			employerName: shipmentData.employerName || "",
			shipmentDescription: shipmentData.shipmentDescription || "",
			number46: shipmentData.number46 || "",
		};

		console.log("Mapped shipment data to be saved:", mappedShipmentData);

		// Save shipment in DB
		const shipment = new Shipment(mappedShipmentData);
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
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.importerName
			}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Employer Name</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.employerName
			}</td>
				</tr>
				<tr>
					<td style="padding:10px; border:1px solid #ddd; background:#f9fafb;"><strong>Description</strong></td>
					<td style="padding:10px; border:1px solid #ddd;">${shipmentData.shipmentDescription
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
					<a href="${process.env.BASE_URL}${shipmentData.invoiceUrl
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
			`Your shipment request with ACID ID ${ACID_ID} has been received and is being processed.`,
			htmlContent
		);

		// 📬 Send notification to user
		if (shipmentData.user_id) {
			try {
				await notificationService.createNotification({
					userId: shipmentData.user_id,
					type: "shipment_created",
					message: `تم إنشاء شحنة جديدة برقم ${shipment.acid}`,
					data: {
						shipmentId: shipment._id,
						shipmentAcid: shipment.acid,
					},
					sendPush: true,
					priority: "medium",
				});
			} catch (notifError) {
				console.error("Failed to send notification:", notifError.message);
			}
		}

		// 📬 Notify assigned employee about new customer/shipment assignment
		if (shipmentData.employee_id) {
			try {
				await notificationService.createNotification({
					userId: shipmentData.employee_id,
					type: "shipment_created",
					title: "تم تعيين عميل جديد لك",
					message: `تم تعيين عميل جديد لك للشحنة ${shipment.acid}`,
					data: {
						shipmentId: shipment._id,
						shipmentAcid: shipment.acid,
						clientId: shipmentData.user_id,
						actionUrl: `/employee/shipments/${shipment._id}`,
					},
					sendPush: true,
					priority: "high",
				});
				console.log(`📬 Employee ${shipmentData.employee_id} notified about new customer assignment`);
			} catch (notifError) {
				console.error("Failed to send employee assignment notification:", notifError.message);
			}
		}

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
		// Get userId from authenticated user (from protect middleware)
		const userId = req.user ? req.user._id : null;
		let userType = req.user ? req.user.type || req.user.userType : null;

		console.log(`🔍 [getAllShipments] userId: ${userId}, userType: ${userType}`);
		console.log(`🔍 [getAllShipments] req.user:`, JSON.stringify(req.user, null, 2));

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "User not authenticated",
			});
		}

		// If userType is not in token, fetch from database
		if (!userType) {
			const User = require("../models/user");
			const user = await User.findById(userId);
			if (user) {
				userType = user.type;
				console.log(`✅ Fetched userType from database: ${userType}`);
			}
		}

		let query = {};

		// If user is a client, show only their shipments
		if (userType === "client") {
			query.user_id = userId;
			console.log(`🔒 Client filter applied for user: ${userId}`);
		} else if (userType === "employee" && req.query.createdBy === "me") {
			query.employee_id = userId;
			console.log(`🔒 Employee filter applied for user: ${userId}`);
		}
		// If user is employee or admin, show all shipments (or filter by employee_id if needed)
		// For now, employees and admins see all shipments

		console.log(`📦 [getAllShipments] Query:`, JSON.stringify(query));

		const shipments = await Shipment.find(query)
			.populate("user_id", "username fullname email")
			.populate("employee_id", "username fullname email")
			.sort({ createdAt: -1 });

		console.log(`📦 [getAllShipments] Found ${shipments.length} shipments for userType: ${userType}`);

		res.json(shipments);
	} catch (error) {
		console.error(`❌ [getAllShipments] Error:`, error);
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
		const { shipmentId } = req.params;

		// Validate if it's a valid MongoDB ObjectId
		const mongoose = require("mongoose");
		if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
			// If not a valid ObjectId, try to find by ACID code
			console.log(
				`Invalid ObjectId format: ${shipmentId}, trying to find by ACID code...`
			);
			let shipment = await Shipment.findOne({ acid: shipmentId })
				.populate("user_id", "username fullname email")
				.populate("employee_id", "username fullname email");

			if (!shipment) {
				return res.status(404).json({ message: "Shipment not found" });
			}

			// Try to populate acid_request_id with uploads if it exists
			if (shipment.acid_request_id) {
				try {
					shipment = await Shipment.findOne({ acid: shipmentId })
						.populate("user_id", "username fullname email")
						.populate("employee_id", "username fullname email")
						.populate({
							path: "acid_request_id",
							populate: {
								path: "uploads",
								model: "Upload",
							},
						});
				} catch (populateError) {
					console.log(
						"Could not populate acid_request_id uploads:",
						populateError.message
					);
					// Continue without populated uploads
				}
			}

			return res.json(shipment);
		}

		let shipment = await Shipment.findById(shipmentId)
			.populate("user_id", "username fullname email")
			.populate("employee_id", "username fullname email");

		if (!shipment)
			return res.status(404).json({ message: "Shipment not found" });

		// Try to populate acid_request_id with uploads if it exists
		if (shipment.acid_request_id) {
			try {
				shipment = await Shipment.findById(shipmentId)
					.populate("user_id", "username fullname email")
					.populate("employee_id", "username fullname email")
					.populate({
						path: "acid_request_id",
						populate: {
							path: "uploads",
							model: "Upload",
						},
					});
			} catch (populateError) {
				console.log(
					"Could not populate acid_request_id uploads:",
					populateError.message
				);
				// Continue without populated uploads
			}
		}

		// Convert to object to allow attaching new properties
		let shipmentObj = shipment.toObject();

        const processDocumentUrl = async (keyOrUrl) => {
            if (!keyOrUrl) return null;
            try {
                // Extract S3 key if input is a URL (e.g., from old unsanitized data)
                const key = (keyOrUrl.includes('amazonaws.com') || keyOrUrl.startsWith('http')) 
                    ? keyOrUrl.split('.com/')[1] 
                    : keyOrUrl;
                
                if (key) {
                    return await s3Helpers.getPresignedUrl(key);
                }
            } catch (err) {
                console.error(`Failed to presign URL for key: ${keyOrUrl}`, err.message);
            }
            return keyOrUrl; // Fallback to original
        };

        // 1. Fetch & Presign General Uploads (Attachments)
        try {
            const generalUploads = await Upload.find({
                category: "shipment",
                relatedId: shipment._id
            }).lean();

            // Presign URLs
            shipmentObj.uploads = await Promise.all(generalUploads.map(async (doc) => {
                const signedUrl = await s3Helpers.getPresignedUrl(doc.s3Key);
                return { 
                    ...doc, 
                    s3Url: signedUrl, // Prefer s3Url prop for frontend
                    url: signedUrl // Fallback
                };
            }));
            
            console.log(`📂 Found ${shipmentObj.uploads.length} general uploads`);
        } catch (err) {
            console.error("❌ Error fetching general uploads:", err.message);
            shipmentObj.uploads = [];
        }

        // 2. Presign Required Documents
        if (shipmentObj.requiredDocuments && shipmentObj.requiredDocuments.length > 0) {
            shipmentObj.requiredDocuments = await Promise.all(shipmentObj.requiredDocuments.map(async (doc) => {
                if (doc.fileId) {
                    const signedUrl = await processDocumentUrl(doc.fileId);
                    return { ...doc, fileId: signedUrl };
                }
                return doc;
            }));
        }

		// 3. Extract & Presign Proforma Invoice from ACID Request Uploads
		if (shipmentObj.acid_request_id && shipmentObj.acid_request_id.uploads) {
			const proforma = shipmentObj.acid_request_id.uploads.find(
				(doc) => doc.documentType === "proforma_invoice"
			);

			if (proforma) {
				try {
					const signedUrl = await s3Helpers.getPresignedUrl(proforma.s3Key);
					shipmentObj.proformaInvoice = {
						...proforma,
						url: signedUrl,
						originalUrl: proforma.url 
					};
					console.log("✅ Proforma Invoice Presigned URL Generated");
				} catch (err) {
					console.error("❌ Failed to presign Proforma Invoice URL:", err);
					shipmentObj.proformaInvoice = proforma; 
				}
			} 
		}

		res.json(shipmentObj);
    } catch (error) {
		console.error("Error in getShipmentById:", error);
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

		// Get the existing shipment to check what changed
		const existingShipment = await Shipment.findOne({ acid });
		if (!existingShipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		// (هنا يتم تحديث الداتا بيز)
		const shipment = await Shipment.findOneAndUpdate({ acid }, updateData, {
			new: true, // (مهم جداً لإرجاع الداتا بعد التحديث)
			runValidators: true,
		});

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

		// 📬 Notify employee if client makes updates to shipment details
		if (shipment.employee_id && req.user && req.user.type === "client") {
			try {
				const updateFields = [];

				// Check what client updated
				if (updateData.claimNumber && updateData.claimNumber !== existingShipment.claimNumber) {
					updateFields.push("رقم المطالبة");
				}
				if (updateData.claimImageUrl && updateData.claimImageUrl !== existingShipment.claimImageUrl) {
					updateFields.push("صورة المطالبة");
				}
				if (updateData.paymentParty && updateData.paymentParty !== existingShipment.paymentParty) {
					updateFields.push(`جهة الدفع (${updateData.paymentParty})`);
				}
				if (updateData.customDuties && updateData.customDuties !== existingShipment.customDuties) {
					updateFields.push("الرسوم الجمركية");
				}

				// Send notification if something relevant was updated
				if (updateFields.length > 0) {
					const fieldsText = updateFields.join("، ");
					await notificationService.createNotification({
						userId: shipment.employee_id,
						type: "shipment_status_changed",
						title: "العميل قام بتحديث بيانات الشحنة",
						message: `قام العميل بتحديث ${fieldsText} للشحنة ${shipment.acid}`,
						data: {
							shipmentId: shipment._id,
							shipmentAcid: shipment.acid,
							updatedFields: updateFields,
							actionUrl: `/employee/shipments/${shipment._id}`,
						},
						sendPush: true,
						priority: "medium",
					});
					console.log(`📬 Employee notified about client updates: ${fieldsText}`);
				}
			} catch (notifError) {
				console.error("Failed to send client update notification:", notifError.message);
			}
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

		const shipments = await Shipment.find({ employee_id: employeeId })
			.populate('user_id', 'fullname username email phone')
			.sort({
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
		const User = require("../models/user");
		var formattedShipments = [];
		for (let shipment of shipments) {
			const user = await User.findById(shipment.employee_id).select(
				"fullname username email"
			);
			formattedShipments.push({
				...shipment.toObject(),
				employee_name: user
					? user.fullname || user.username || user.email
					: "N/A",
			});
		}
		console.log(
			`Found ${formattedShipments.length} shipments for user ${userId}`
		);

		res.json(formattedShipments);
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
		const { status, number46, subStatus, paymentParty } = req.body;

		// Build update object
		const updateData = {};

		// Validate and add status if provided
		if (status) {
			const validStatuses = [
				"في انتظار الشحن",
				"في الطريق",
				"تم وصول البضاعة",
				"في انتظار وصول الإذن",
				"تم وصول الإذن",
				"التخليص الجمركي",
				"جارى ادراج الشحنة واستكمال الاجراءات",
				"جاري الكشف والتثمين",
				"مكتملة",
				"تمت بنجاح",
			];

			if (!validStatuses.includes(status)) {
				return res.status(400).json({
					message: "Invalid status value",
					validStatuses,
				});
			}
			updateData.status = status;

			// Clear subStatus and paymentParty if status is NOT "جاري الكشف والتثمين"
			if (status !== "جاري الكشف والتثمين") {
				updateData.subStatus = null;
				updateData.paymentParty = null;
			}
		}

		// Handle subStatus update
		if (subStatus !== undefined) {
			const validSubStatuses = [
				null,
				"انتظار الرسوم الجمركية من المصلحة",
				"ادخال رقم المطالبة و صورة المطالبة",
				"اختيار جهة الدفع",
				"في انتظار استلام الافراج الجمركى",
				"مرحلة الترانزيت",
			];

			if (subStatus !== null && !validSubStatuses.includes(subStatus)) {
				return res.status(400).json({
					message: "Invalid subStatus value",
					validSubStatuses,
				});
			}
			updateData.subStatus = subStatus;
		}

		// Handle paymentParty update
		if (paymentParty !== undefined) {
			const validPaymentParties = [null, "العميل", "الشركة"];

			if (paymentParty !== null && !validPaymentParties.includes(paymentParty)) {
				return res.status(400).json({
					message: "Invalid paymentParty value",
					validPaymentParties,
				});
			}
			updateData.paymentParty = paymentParty;
		}

		// Add number46 if provided
		if (number46 !== undefined) {
			updateData.number46 = number46;
		}

		// Check if there's anything to update
		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({ message: "No valid fields to update" });
		}

		// Find and update shipment
		// First, get the old status before updating
		const existingShipment = await Shipment.findById(shipmentId);
		const oldStatus = existingShipment?.status;

		const shipment = await Shipment.findByIdAndUpdate(shipmentId, updateData, {
			new: true,
			runValidators: true,
		});

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		// Emit socket event for real-time updates
		if (req.io) {
			req.io.to(shipment.acid).emit("shipmentStatusUpdate", {
				shipmentId: shipment._id,
				acid: shipment.acid,
				status: shipment.status,
				subStatus: shipment.subStatus,
				paymentParty: shipment.paymentParty,
				updatedAt: new Date(),
			});
			console.log(
				`Socket event emitted for shipment ID: ${shipmentId} with status: ${status}, subStatus: ${subStatus}`
			);
		}

		// 📬 Send notification to client about status change
		if (shipment.user_id && status && oldStatus !== status) {
			try {
				await notificationService.notifyShipmentStatusChange(
					shipment.user_id,
					shipment._id,
					shipment.acid,
					oldStatus,
					status
				);
				console.log(`📬 Notification sent for shipment status change: ${oldStatus} → ${status}`);
			} catch (notifError) {
				console.error("Failed to send status change notification:", notifError.message);
			}
		}

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
		const formattedDocuments = documents.map((doc) => ({
			name: doc.name || doc,
			uploaded: false,
			requestedAt: new Date(),
		}));

		shipment.requiredDocuments = [
			...(shipment.requiredDocuments || []),
			...formattedDocuments,
		];

		await shipment.save();

		// Prepare email content
		const documentsList = documents
			.map((doc) => `<li style="padding:5px 0;">${doc.name || doc}</li>`)
			.join("");

		const htmlContent = `
			<!doctype html>
			<html dir="rtl" lang="ar">
			<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Required Documents Request</title>
			<style>
				body { direction: rtl; text-align: right; }
				.rtl-text { direction: rtl; text-align: right; unicode-bidi: embed; }
			</style>
			</head>
			<body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; background:#f5f7fa; padding:20px; direction:rtl;">
			<div class="rtl-text" style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:10px; box-shadow:0 0 8px rgba(0,0,0,0.1);">
				<h2 style="color:#dc2626; text-align:center; direction:rtl;">📄 مستندات مطلوبة لشحنتك</h2>
				<p style="direction:rtl; text-align:right;">مرحباً <strong>${shipment.user_id?.username ||
			shipment.user_id?.fullname ||
			"عزيزي العميل"
			}</strong>,</p>
				<p style="direction:rtl; text-align:right;">نود إعلامك بأننا نحتاج إلى المستندات التالية لاستكمال معالجة شحنتك:</p>

				<div style="background:#fef2f2; border-right:4px solid #dc2626; padding:15px; margin:20px 0; border-radius:5px; direction:rtl; text-align:right;">
					<h3 style="color:#dc2626; margin-top:0; direction:rtl;">تفاصيل الشحنة:</h3>
					<p style="margin:5px 0; direction:rtl;"><strong>رقم ACID:</strong> ${shipment.acid}</p>
					<p style="margin:5px 0; direction:rtl;"><strong>رقم البوليصة:</strong> ${shipment.number46 || "غير محدد"
			}</p>
					<p style="margin:5px 0; direction:rtl;"><strong>الحالة الحالية:</strong> ${shipment.status}</p>
				</div>

				<h3 style="color:#dc2626; direction:rtl; text-align:right;">المستندات المطلوبة:</h3>
				<ul style="background:#f9fafb; padding:20px 40px; border-radius:5px; list-style:disc; direction:rtl; text-align:right;">
					${documentsList}
				</ul>

				<div style="background:#fef3c7; border:1px solid #fbbf24; padding:15px; margin:20px 0; border-radius:5px; text-align:center; direction:rtl;">
					<p style="margin:0; color:#92400e; direction:rtl;"><strong>⚠️ مهم:</strong> يرجى رفع المستندات المطلوبة في أقرب وقت ممكن لتجنب أي تأخير في معالجة شحنتك.</p>
				</div>

				<div style="text-align:center; margin-top:30px; direction:rtl;">
					<a href="${process.env.FRONTEND_URL ||
			"http://section-assignment-bucket.s3-website-us-east-1.amazonaws.com"
			}/shipmentstatus/${shipment.acid}" 
					   style="display:inline-block; background:#dc2626; color:#ffffff; padding:12px 30px; text-decoration:none; border-radius:8px; font-weight:bold;">
						رفع المستندات الآن
					</a>
				</div>

				<p style="margin-top:25px; direction:rtl; text-align:right;">إذا كانت لديك أي أسئلة، يرجى التواصل مع فريق الدعم.</p>

				<p style="margin-top:25px; direction:rtl; text-align:right;">مع أطيب التحيات،<br><strong>فريق الدعم - النوران</strong></p>

				<hr style="margin-top:30px; border:none; border-top:1px solid #eee;">
				<p style="font-size:12px; color:#888; text-align:center; direction:rtl;">هذه رسالة آلية - يرجى عدم الرد عليها مباشرة.</p>
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
				`يرجى تقديم المستندات المطلوبة للشحنة رقم ${shipment.acid}`,
				htmlContent
			);
		}

		// 📬 Send push notification for document request
		try {
			await notificationService.notifyShipmentDocumentsRequested(
				shipment.user_id._id || shipment.user_id,
				shipment._id,
				shipment.acid,
				documents  // Pass the array directly, not the string
			);
			console.log(`📬 Document request notification sent to user: ${shipment.user_id._id || shipment.user_id}`);
		} catch (notifError) {
			console.error("Failed to send document request notification:", notifError.message);
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

		const shipment = await Shipment.findById(shipmentId).select(
			"requiredDocuments acid"
		);

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		// Convert to plain object to ensure all fields are included
		const requiredDocs = shipment.requiredDocuments.map((doc) => ({
			_id: doc._id,
			name: doc.name,
			uploaded: doc.uploaded,
			fileId: doc.fileId || null,
			requestedAt: doc.requestedAt,
			uploadedAt: doc.uploadedAt || null,
		}));

		console.log(
			"📋 Returning required documents:",
			JSON.stringify(requiredDocs, null, 2)
		);

		res.json({
			success: true,
			data: {
				shipmentId: shipment._id,
				acid: shipment.acid,
				requiredDocuments: requiredDocs,
			},
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

		console.log("📝 Marking document as uploaded:", {
			shipmentId,
			documentId,
			fileId,
		});

		const shipment = await Shipment.findById(shipmentId);

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		const document = shipment.requiredDocuments.id(documentId);

		if (!document) {
			return res.status(404).json({ message: "Document not found" });
		}

		console.log("Before update:", {
			name: document.name,
			uploaded: document.uploaded,
			fileId: document.fileId,
		});

		// Update document fields
		document.uploaded = true;
		document.uploadedAt = new Date();
		document.fileId = fileId; // Always set fileId, even if it's undefined/null it should be set

		console.log("After update:", {
			name: document.name,
			uploaded: document.uploaded,
			fileId: document.fileId,
		});

		await shipment.save();

		console.log("After save:", {
			name: document.name,
			uploaded: document.uploaded,
			fileId: document.fileId,
		});

		// Emit socket event
		if (req.io) {
			req.io.to(shipment.acid).emit("documentUploaded", {
				shipmentId: shipment._id,
				acid: shipment.acid,
				documentId: documentId,
				documentName: document.name,
			});
		}

		// Return the document as plain object to ensure all fields are included
		const updatedDoc = {
			_id: document._id,
			name: document.name,
			uploaded: document.uploaded,
			fileId: document.fileId,
			requestedAt: document.requestedAt,
			uploadedAt: document.uploadedAt,
		};

		console.log("✅ Returning updated document:", updatedDoc);

		// 📬 Notify assigned employee about document upload
		if (shipment.employee_id && req.user && req.user.type === "client") {
			try {
				await notificationService.createNotification({
					userId: shipment.employee_id,
					type: "document_uploaded",
					title: "العميل قام برفع مستند",
					message: `قام العميل برفع مستند "${document.name}" للشحنة ${shipment.acid}`,
					data: {
						shipmentId: shipment._id,
						shipmentAcid: shipment.acid,
						documentId: documentId,
						documentName: document.name,
						actionUrl: `/employee/shipments/${shipment._id}`,
					},
					sendPush: true,
					priority: "medium",
				});
				console.log(`📬 Employee notified about document upload: ${document.name}`);
			} catch (notifError) {
				console.error("Failed to send document upload notification:", notifError.message);
			}
		}

		res.json({
			success: true,
			message: "Document marked as uploaded successfully",
			data: updatedDoc,
		});
	} catch (error) {
		console.error("Error marking document as uploaded:", error);
		res.status(500).json({ message: error.message });
	}
};

// ✅ Reset/Delete uploaded document (allows client to re-upload)
const resetUploadedDocument = async (req, res) => {
	try {
		const { shipmentId, documentId } = req.params;

		console.log("🗑️ Deleting document completely:", {
			shipmentId,
			documentId,
		});

		const shipment = await Shipment.findById(shipmentId);

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		const document = shipment.requiredDocuments.id(documentId);

		if (!document) {
			return res.status(404).json({ message: "Document not found" });
		}

		const documentName = document.name;

		// COMPLETELY REMOVE the document from the array
		shipment.requiredDocuments.pull(documentId);

		await shipment.save();

		console.log("✅ Document removed completely:", documentName);

		// Emit socket event
		if (req.io) {
			req.io.to(shipment.acid).emit("documentDeleted", {
				shipmentId: shipment._id,
				acid: shipment.acid,
				documentId: documentId,
				documentName: documentName,
			});
		}

		res.json({
			success: true,
			message: "تم حذف المستند بنجاح.",
		});
	} catch (error) {
		console.error("Error resetting document:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Get shipment statistics for employee
const getEmployeeShipmentStats = async (req, res) => {
	try {
		const { employeeId } = req.params;

		if (!employeeId) {
			return res.status(400).json({ message: "Employee ID is required" });
		}

		// Get all shipments for this employee
		const allShipments = await Shipment.find({ employee_id: employeeId });

		// Count completed shipments (both English and Arabic statuses)
		const completedCount = allShipments.filter(
			(shipment) =>
				shipment.status === "Completed" || shipment.status === "تمت بنجاح"
		).length;

		// Count in-progress shipments (all except completed)
		const inProgressCount = allShipments.length - completedCount;

		res.json({
			success: true,
			stats: {
				completed: completedCount,
				inProgress: inProgressCount,
				total: allShipments.length,
			},
		});
	} catch (error) {
		console.error("Error fetching employee shipment stats:", error);
		res.status(500).json({ message: error.message });
	}
};

// Get client shipment statistics
const getClientShipmentStats = async (req, res) => {
	try {
		const { userId } = req.params;

		if (!userId) {
			return res.status(400).json({ message: "User ID is required" });
		}

		// Get all shipments for this client
		const allShipments = await Shipment.find({ user_id: userId });

		// Count completed shipments (both English and Arabic statuses)
		const completedCount = allShipments.filter(
			(shipment) =>
				shipment.status === "Completed" || shipment.status === "تمت بنجاح"
		).length;

		// Count in-progress shipments (all except completed)
		const inProgressCount = allShipments.length - completedCount;

		res.json({
			success: true,
			stats: {
				completed: completedCount,
				inProgress: inProgressCount,
				total: allShipments.length,
			},
		});
	} catch (error) {
		console.error("Error fetching client shipment stats:", error);
		res.status(500).json({ message: error.message });
	}
};

const mostActiveClients = async (req, res) => {
	console.log("here");
	try {
		const result = await Shipment.aggregate([
			{
				$group: {
					_id: "$user_id",
					count: { $sum: 1 },
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "_id",
					foreignField: "_id",
					as: "user",
				},
			},
			{
				$unwind: "$user",
			},
			{
				$project: {
					_id: 1,
					count: 1,
					name: "$user.fullname",
				},
			},
			{ $sort: { count: -1 } },
		]);

		return res.status(200).json({ result });
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

const cleanFacet = (facetResult, field, key = "count") => {
	return facetResult[field]?.[0]?.[key] || 0;
};

// Get revenue comparison by shipment type (air/sea) per month
const getRevenueComparison = async (req, res) => {
	try {
		console.log("Fetching revenue comparison data...");
		const result = await Shipment.aggregate([
			{
				$lookup: {
					from: "invoices",
					localField: "_id",
					foreignField: "shipmentId",
					as: "invoices",
				},
			},
			{
				$unwind: {
					path: "$invoices",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: {
						month: { $month: "$createdAt" },
						year: { $year: "$createdAt" },
						type: "$shipmentType",
					},
					revenue: { $sum: { $toDouble: "$invoices.feePrice" } },
				},
			},
			{
				$sort: { "_id.year": 1, "_id.month": 1 },
			},
		]);

		// Transform data for frontend
		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];

		const dataMap = {};
		result.forEach((item) => {
			const monthLabel = monthNames[item._id.month - 1];
			if (!dataMap[monthLabel]) {
				dataMap[monthLabel] = { label: monthLabel, sea: 0, air: 0 };
			}
			if (item._id.type === "sea") {
				dataMap[monthLabel].sea = item.revenue || 0;
			} else if (item._id.type === "air") {
				dataMap[monthLabel].air = item.revenue || 0;
			}
		});

		const chartData = Object.values(dataMap);
		console.log("Revenue comparison result:", chartData);
		return res.status(200).json(chartData);
	} catch (err) {
		console.error("Error in getRevenueComparison:", err);
		return res.status(500).json({ message: err.message });
	}
};

const getDashboardStats = async (req, res) => {
	try {
		const invoiceStats = await Invoice.aggregate([
			{
				$facet: {
					ongoingInvoices: [
						{ $match: { status: "ongoing" } },
						{ $count: "count" },
					],

					completedInvoices: [
						{ $match: { status: "completed" } },
						{ $count: "count" },
					],

					poundRevenue: [
						{ $match: { currencyType: "pound" } },
						{
							$group: {
								_id: null,
								total: { $sum: { $toDouble: "$feePrice" } },
							},
						},
					],

					dollarRevenue: [
						{ $match: { currencyType: "dollar" } },
						{
							$group: {
								_id: null,
								total: { $sum: { $toDouble: "$feePrice" } },
							},
						},
					],

					totalPayments: [
						{
							$group: {
								_id: null,
								totalPaid: {
									$sum: {
										$add: [
											{ $toDouble: "$feePrice" },
											{ $toDouble: "$Port_fee_price" },
											{ $toDouble: "$Additional_Services_price" },
											{ $toDouble: "$Clearance_Fees_price" },
											{ $toDouble: "$Expense_Tips_price" },
											{ $toDouble: "$Sundries_price" },
										],
									},
								},
							},
						},
					],
				},
			},
		]);

		const shipmentStats = await Shipment.aggregate([
			{
				$facet: {
					totalShipments: [{ $count: "count" }],

					ongoingAirShipments: [
						{ $match: { status: "ongoing", shipmentType: "air" } },
						{ $count: "count" },
					],

					completedShipments: [
						{
							$match: {
								status: {
									$in: ["completed", "Completed", "مكتملة", "تمت بنجاح"],
								},
							},
						},
						{ $count: "count" },
					],
				},
			},
		]);

		// Calculate ongoing sea shipments = total - completed
		const totalShipments = cleanFacet(shipmentStats[0], "totalShipments");
		const completedShipments = cleanFacet(
			shipmentStats[0],
			"completedShipments"
		);
		const ongoingSeaShipments = totalShipments - completedShipments;

		return res.status(200).json({
			ongoingInvoices: cleanFacet(invoiceStats[0], "ongoingInvoices"),
			completedInvoices: cleanFacet(invoiceStats[0], "completedInvoices"),

			poundRevenue: cleanFacet(invoiceStats[0], "poundRevenue", "total"),
			dollarRevenue: cleanFacet(invoiceStats[0], "dollarRevenue", "total"),

			totalPayments: cleanFacet(invoiceStats[0], "totalPayments", "totalPaid"),

			ongoingSeaShipments: ongoingSeaShipments,
			ongoingAirShipments: cleanFacet(shipmentStats[0], "ongoingAirShipments"),
			completedShipments: completedShipments,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ✅ Search shipments by any field (user's shipments only)
const searchShipments = async (req, res) => {
	try {
		const { query } = req.query;
		const userId = req.user?.id || req.user?._id;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "User not authenticated",
			});
		}

		// Base criteria - only user's shipments
		const baseCriteria = { user_id: userId };

		// If no query or very short, return recent shipments
		if (!query || query.trim().length < 2) {
			const recentShipments = await Shipment.find(baseCriteria)
				.populate("user_id", "username email fullname")
				.populate("employee_id", "username email fullname")
				.sort({ createdAt: -1 })
				.limit(10);

			return res.json({
				success: true,
				count: recentShipments.length,
				shipments: recentShipments,
			});
		}

		// Build search criteria - search across multiple fields
		const searchRegex = new RegExp(query, "i"); // case-insensitive

		const searchCriteria = {
			...baseCriteria,
			$or: [
				{ acid: searchRegex },
				{ port_name: searchRegex },
				{ country: searchRegex },
				{ status: searchRegex },
				{ policy: searchRegex },
				{ third_gomroky: searchRegex },
				{ number46: searchRegex },
				{ bl_number: searchRegex },
				{ shipmentCode: searchRegex },
			],
		};

		const shipments = await Shipment.find(searchCriteria)
			.populate("user_id", "username email fullname")
			.populate("employee_id", "username email fullname")
			.sort({ createdAt: -1 })
			.limit(20); // Limit results for recommendations

		res.json({
			success: true,
			count: shipments.length,
			shipments,
		});
	} catch (error) {
		console.error("Error searching shipments:", error);
		res.status(500).json({
			success: false,
			message: "Server error while searching shipments",
		});
	}
};

// ✅ Get predefined document names for autocomplete suggestions
// Only returns predefined document types - does NOT save custom entries
const getDistinctDocumentNames = async (req, res) => {
	try {
		// Only return predefined document names - no database queries
		// Custom entries typed by employee will NOT be saved for future use
		const predefinedNames = [
			"صورة البطاقة",
			"صورة السجل التجاري",
			"صورة البطاقة الضريبية",
			"شهادة المنشأ",
			"بوليصة الشحن",
			"صورة الفاتورة",
			"صورة العقد",
			"كشف العبوة",
			"إذن الإفراج",
			"صورة التوكيل",
			"شهادة الجودة",
			"شهادة المطابقة",
			"صورة بطاقة الاستيراد",
			"صورة رخصة الاستيراد",
			"صورة الموافقة الجمركية",
			"الفاتورة التجارية",
			"شهادة الصحة",
			"شهادة التأمين",
			"إذن الاستيراد",
			"تصريح الجمارك",
		];

		res.json({
			success: true,
			documentNames: predefinedNames,
		});
	} catch (error) {
		console.error("Error getting document names:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching document names",
		});
	}
};

// ✅ Reject uploaded document (Reset to pending but keep request)
const rejectUploadedDocument = async (req, res) => {
	try {
		const { shipmentId, documentId } = req.params;

		console.log("❌ Rejecting document upload:", {
			shipmentId,
			documentId,
		});

		const shipment = await Shipment.findById(shipmentId);

		if (!shipment) {
			return res.status(404).json({ message: "Shipment not found" });
		}

		const document = shipment.requiredDocuments.id(documentId);

		if (!document) {
			return res.status(404).json({ message: "Document not found" });
		}

		const documentName = document.name;

		// Keep request, but reset upload status
		document.uploaded = false;
		document.fileId = null;
		document.uploadedAt = null;

		await shipment.save();

		console.log("✅ Document upload rejected:", documentName);

		// Emit socket event
		if (req.io) {
			req.io.to(shipment.acid).emit("documentRejected", {
				shipmentId: shipment._id,
				acid: shipment.acid,
				documentId: documentId,
				documentName: documentName,
			});
		}
        
        // Notify Client
        if (shipment.user_id) {
             try {
				await notificationService.createNotification({
					userId: shipment.user_id,
					type: "document_rejected",
					title: "مستند مرفوض",
					message: `تم رفض المستند "${documentName}" للشحنة ${shipment.acid}. يرجى رفعه مرة أخرى.`,
					data: {
						shipmentId: shipment._id,
						acid: shipment.acid,
						documentId: documentId,
					},
					sendPush: true,
					priority: "high",
				});
            } catch (err) {
                console.error("Failed to notify client about rejection:", err);
            }
        }

		res.json({
			success: true,
			message: "تم رفض المستند وإعادة تعيين حالته.",
            data: {
                _id: document._id,
                name: document.name,
                uploaded: false,
                requestedAt: document.requestedAt
            }
		});
	} catch (error) {
		console.error("Error rejecting document:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Add completed document directly (Employee Action)
const addCompletedDocument = async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const { name, fileId } = req.body;

        if (!name || !fileId) {
            return res.status(400).json({ message: "Missing document name or fileId" });
        }

        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
            return res.status(404).json({ message: "Shipment not found" });
        }

        // Add to requiredDocuments as already completed
        shipment.requiredDocuments.push({
            name,
            uploaded: true,
            fileId, // This is the S3 Key or URL
            requestedAt: new Date(),
            uploadedAt: new Date()
        });

        await shipment.save();
        
        console.log(`✅ Document added directly by employee: ${name}`);

        res.json({
            success: true,
            message: "تم إضافة المستند بنجاح",
            data: shipment
        });

    } catch (error) {
        console.error("Error adding completed document:", error);
        res.status(500).json({ message: "حدث خطأ أثناء إضافة المستند" });
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
	updateShipmentStatusById,
	requestRequiredDocuments,
	getRequiredDocuments,
	markDocumentAsUploaded,
	resetUploadedDocument,
    rejectUploadedDocument,
    addCompletedDocument,
	getEmployeeShipmentStats,
	getClientShipmentStats,
	addShipments,
	mostActiveClients,
	getDashboardStats,
	getRevenueComparison,
	searchShipments,
	getDistinctDocumentNames,
};
