const AcidRequest = require("../models/acid");

// ✅ إنشاء طلب ACID جديد
const createAcidRequest = async (req, res) => {
	try {
		const { supplier, goods, uploads } = req.body;

		// Get userId from authenticated user (from protect middleware)
		const userId = req.user ? req.user._id : null;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "User not authenticated",
			});
		}

		// Validate required fields
		if (!supplier || !supplier.name || !supplier.taxNum) {
			return res.status(400).json({
				success: false,
				message: "Supplier name and tax number are required",
			});
		}

		if (!goods || !goods.description) {
			return res.status(400).json({
				success: false,
				message: "Goods description is required",
			});
		}

		const newRequest = new AcidRequest({
			userId,
			supplier,
			goods,
			uploads: uploads || [], // Array of Upload document IDs
		});

		await newRequest.save();

		// Populate uploads to return full upload details
		await newRequest.populate("uploads");

		res.status(201).json({
			success: true,
			message: "ACID request created successfully",
			request: newRequest,
		});
	} catch (error) {
		console.error("Error creating ACID request:", error);
		res.status(500).json({
			success: false,
			message: "Server error while creating ACID request",
			error: error.message,
		});
	}
};

// ✅ عرض كل الطلبات
const getAllRequests = async (req, res) => {
	try {
		// Get userId from authenticated user (from protect middleware)
		const userId = req.user ? req.user._id : null;

		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "User not authenticated",
			});
		}

		// Filter requests by userId to show only current user's requests
		const requests = await AcidRequest.find({ userId }).sort({
			requestDate: -1,
		});
		res.json(requests);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error while fetching requests" });
	}
};

// ✅ عرض طلب واحد برقم ACID أو ID
const getRequestByAcid = async (req, res) => {
	try {
		const { acid } = req.params;
		const mongoose = require("mongoose");
		let request;

		// Check if the parameter is a valid MongoDB ObjectId
		if (mongoose.Types.ObjectId.isValid(acid)) {
			// Try to find by ID first
			request = await AcidRequest.findById(acid);
		}

		// If not found by ID, try to find by acidCode
		if (!request) {
			request = await AcidRequest.findOne({ acidCode: acid });
		}

		if (!request) {
			return res.status(404).json({ message: "ACID request not found" });
		}

		res.json(request);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error while fetching request" });
	}
};

// ✅ تحديث حالة الطلب أو إصدار كود ACID
const updateAcidStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, acidCode, supplier, goods, uploads } = req.body;

		const request = await AcidRequest.findById(id);

		if (!request) {
			return res.status(404).json({ message: "Request not found" });
		}

		// Check if user owns this request
		const userId = req.user ? req.user._id : null;
		if (userId && request.userId.toString() !== userId.toString()) {
			return res.status(403).json({
				success: false,
				message: "You don't have permission to update this request",
			});
		}

		// Update fields
		if (status) request.status = status;
		if (acidCode) request.acidCode = acidCode;
		if (supplier) request.supplier = supplier;
		if (goods) request.goods = goods;
		if (uploads) request.uploads = uploads;

		await request.save();

		res.json({
			message: "ACID request updated successfully",
			request,
		});
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.json({ message: "Server error while updating ACID request" });
	}
};

module.exports = {
	createAcidRequest,
	getAllRequests,
	getRequestByAcid,
	updateAcidStatus,
};
