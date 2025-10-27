const Shipment = require("../models/shipment");

// ✅ إنشاء شحنة جديدة
const createShipment = async (req, res) => {
	try {
		const shipmentData = req.body;

		// If file was uploaded, add the file URL to shipment data
		if (req.file) {
			shipmentData.invoiceUrl = `/uploads/shipments/${req.file.filename}`;
		}

		const shipment = new Shipment(shipmentData);
		await shipment.save();
		res.status(201).json(shipment);
	} catch (error) {
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
                status: shipment.status 
            });
            console.log(`Socket event emitted for ACID: ${acid} with status: ${shipment.status}`);
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
