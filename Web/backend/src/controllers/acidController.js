const AcidRequest = require("../models/acid");

// ✅ إنشاء طلب ACID جديد
const createAcidRequest = async (req, res) => {
	try {
		const { supplier, goods } = req.body;

		const newRequest = new AcidRequest({
			supplier,
			goods,
		});

		await newRequest.save();
		res.status(201).json({
			message: "ACID request created successfully",
			request: newRequest,
		});
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.json({ message: "Server error while creating ACID request" });
	}
};

// ✅ عرض كل الطلبات
const getAllRequests = async (req, res) => {
	try {
		const requests = await AcidRequest.find().sort({ requestDate: -1 });
		res.json(requests);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error while fetching requests" });
	}
};

// ✅ عرض طلب واحد برقم ACID
const getRequestByAcid = async (req, res) => {
	try {
		const { acid } = req.params;
		const request = await AcidRequest.findOne({ acidCode: acid });

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
		const { status, acidCode } = req.body;

		const request = await AcidRequest.findById(id);

		if (!request) {
			return res.status(404).json({ message: "Request not found" });
		}

		if (status) request.status = status;
		if (acidCode) request.acidCode = acidCode;

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
