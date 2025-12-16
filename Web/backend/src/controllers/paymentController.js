const Payment = require("../models/payment");
const Invoice = require("../models/invoice");
const User = require("../models/user"); // Assuming User model path

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
    try {
        const { transactions, paymentMethod } = req.body;

        // Assuming req.user is set by auth middleware
        const userId = req.user.id;

        console.log("Creating Payment - Request Body:", req.body);
        console.log("Creating Payment - User ID:", userId);

        if (!transactions || transactions.length === 0) {
            console.error("Payment Creation Failed: No transactions provided");
            return res.status(400).json({ message: "No transaction details provided" });
        }

        const payment = await Payment.create({
            userId,
            paymentMethod: paymentMethod || "BANK_TRANSFER",
            transactions,
        });

        res.status(201).json(payment);
    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get logged in user payments
// @route   GET /api/payments/my-payments
// @access  Private
const getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'fullname email username')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error("Error fetching all payments:", error);
        res.status(500).json({ message: "Server Error" });
    }
}

// @desc    Get financial summary for all users (Admin)
// @route   GET /api/payments/admin/summary
// @access  Private/Admin
const getAdminFinancials = async (req, res) => {
    try {
        // 1. Get all invoices grouped by user
        const invoices = await Invoice.find();

        // 2. Get all payments grouped by user
        const payments = await Payment.find().sort({ createdAt: -1 });

        // 3. Get all users (client type primarily, or all)
        // Optimization: Only get users who have invoices or payments
        const userIdsWithActivity = new Set([
            ...invoices.map(inv => inv.userId?.toString()),
            ...payments.map(pay => pay.userId?.toString())
        ].filter(Boolean));

        const users = await User.find({ _id: { $in: Array.from(userIdsWithActivity) } })
            .select('fullname username email type clientDetails wallet');

        const summary = users.map(user => {
            const userIdStr = user._id.toString();

            // Calculate Total Due from Invoices
            const userInvoices = invoices.filter(inv => inv.userId?.toString() === userIdStr);
            let totalDue = 0;
            userInvoices.forEach(inv => {
                inv.invoiceItems.forEach(item => {
                    let price = item.itemPrice;
                    if (item.currencyType === "USD") {
                        price = price * 50;
                    }
                    totalDue += price;
                });
            });

            // Get Payments
            const userPayments = payments.filter(pay => pay.userId?.toString() === userIdStr);

            return {
                user: {
                    _id: user._id,
                    name: user.fullname || user.username,
                    email: user.email,
                    type: user.type,
                    wallet: user.wallet || 0
                },
                totalDue,
                invoicesCount: userInvoices.length,
                pendingPaymentsCount: userPayments.filter(p => p.transactions.some(t => t.status === "PENDING")).length,
                payments: userPayments
            };
        });

        res.json(summary);

    } catch (error) {
        console.error("Error details:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Update user wallet (Admin)
// @route   PUT /api/payments/users/:userId/wallet
// @access  Private/Admin
const updateUserWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, type } = req.body; // type: 'add' or 'set'

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (type === 'add') {
            user.wallet = (user.wallet || 0) + Number(amount);
        } else if (type === 'set') {
            user.wallet = Number(amount);
        } else {
            user.wallet = (user.wallet || 0) + Number(amount); // Default to add
        }

        await user.save();
        res.json({ message: "Wallet updated", wallet: user.wallet });

    } catch (error) {
        console.error("Error updating wallet:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update transaction status
// @route   PATCH /api/payments/:paymentId/transactions/:transactionId
// @access  Private/Admin
const updateTransactionStatus = async (req, res) => {
    try {
        const { paymentId, transactionId } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        const transaction = payment.transactions.id(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        transaction.status = status;

        // If approved, should we auto-deduct? 
        // User requested manual "Clear" button on client side. 
        // But if admin approves a "Top Up" receipt, we might want to add to wallet?
        // For now, adhere to instructions: "add new button in table named 'add in wallet'".
        // So checking the image is just verification, adding money is manual.

        await payment.save();

        res.json(payment);

    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    createPayment,
    getMyPayments,
    getAllPayments,
    getAdminFinancials,
    updateTransactionStatus,
    updateUserWallet
};
