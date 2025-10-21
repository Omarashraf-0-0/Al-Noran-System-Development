const Finance = require("../models/finance");

// ✅ إنشاء سجل مالي جديد لشحنة معينة
const createFinanceRecord = async (req, res) => {
	try {
		const { ACID } = req.params;
		const existing = await Finance.findOne({ ACID });

		if (existing) {
			return res
				.status(400)
				.json({ message: "Finance record already exists for this shipment" });
		}

		const finance = new Finance({ ACID });
		await finance.save();
		res.status(201).json(finance);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server Error" });
	}
};

// ✅ إضافة فاتورة جديدة
const addInvoice = async (req, res) => {
	try {
		const { ACID } = req.params;
		const { invoiceNumber, description, amount } = req.body;

		const finance = await Finance.findOne({ ACID });
		if (!finance)
			return res.status(404).json({ message: "Finance record not found" });

		finance.invoices.push({ invoiceNumber, description, amount });
		finance.balance -= amount; // يقلل من الرصيد لأن عليه فلوس
		await finance.save();

		res.json(finance);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server Error" });
	}
};

// ✅ إضافة دفعة مالية
const addPayment = async (req, res) => {
	try {
		const { ACID } = req.params;
		const { paymentId, method, amount } = req.body;

		const finance = await Finance.findOne({ ACID });
		if (!finance)
			return res.status(404).json({ message: "Finance record not found" });

		finance.payments.push({ paymentId, method, amount });
		finance.balance += amount; // زاد الرصيد بعد الدفع
		await finance.save();

		res.json(finance);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server Error" });
	}
};

// ✅ جلب كل الفواتير والمدفوعات لشحنة معينة
const getFinanceDetails = async (req, res) => {
	try {
		const { ACID } = req.params;
		const finance = await Finance.findOne({ ACID });

		if (!finance)
			return res.status(404).json({ message: "Finance record not found" });

		res.json({
			ACID: finance.ACID,
			invoices: finance.invoices,
			payments: finance.payments,
			balance: finance.balance,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server Error" });
	}
};

module.exports = {
	createFinanceRecord,
	addInvoice,
	addPayment,
	getFinanceDetails,
};
