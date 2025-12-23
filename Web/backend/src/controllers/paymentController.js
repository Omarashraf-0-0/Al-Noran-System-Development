const Payment = require("../models/payment");
const Invoice = require("../models/invoice");
const User = require("../models/user"); // Assuming User model path
const notificationService = require("../services/notificationService");
const { getPresignedUrl } = require("../utils/s3Helpers");

// Helper function to generate presigned URLs for payment transactions
const generatePresignedUrlsForPayments = async (payments) => {
    const paymentsWithUrls = [];
    for (const payment of payments) {
        const paymentObj = payment.toObject ? payment.toObject() : { ...payment };
        const transactionsWithUrls = [];
        
        for (const tx of paymentObj.transactions) {
            let imageUrl = tx.imageUrls;
            // Check if it's an S3 key (not already a full URL or if it's an expired presigned URL)
            if (imageUrl && !imageUrl.startsWith('blob:')) {
                try {
                    // If it's already a full S3 URL, extract the key
                    if (imageUrl.includes('amazonaws.com')) {
                        // Extract s3Key from URL: https://bucket.s3.region.amazonaws.com/key or presigned URL
                        const urlObj = new URL(imageUrl.split('?')[0]); // Remove query params
                        imageUrl = decodeURIComponent(urlObj.pathname.substring(1)); // Remove leading /
                    }
                    // Generate fresh presigned URL
                    const presignedUrl = await getPresignedUrl(imageUrl, 3600); // 1 hour expiry
                    transactionsWithUrls.push({ ...tx, imageUrls: presignedUrl });
                } catch (err) {
                    console.error(`Failed to generate presigned URL for: ${tx.imageUrls}`, err.message);
                    transactionsWithUrls.push(tx); // Keep original if generation fails
                }
            } else {
                transactionsWithUrls.push(tx);
            }
        }
        paymentsWithUrls.push({ ...paymentObj, transactions: transactionsWithUrls });
    }
    return paymentsWithUrls;
};

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

        // 📬 Send notification to client about payment receipt upload
        try {
            await notificationService.notifyPaymentReceiptUploaded(userId, payment._id);
            console.log(`📬 Payment receipt notification sent to user: ${userId}`);
        } catch (notifError) {
            console.error("Failed to send payment receipt notification:", notifError.message);
        }

        // 📬 Notify assigned employee about client payment upload
        try {
            // Find if any invoices in the payment have related shipments with assigned employees
            for (const transaction of transactions) {
                if (transaction.invoiceId) {
                    const invoice = await Invoice.findById(transaction.invoiceId).populate('shipmentId');
                    if (invoice && invoice.shipmentId && invoice.shipmentId.employee_id) {
                        await notificationService.createNotification({
                            userId: invoice.shipmentId.employee_id,
                            type: "payment_received",
                            title: "العميل قام برفع إيصال دفع",
                            message: `قام العميل برفع إيصال دفع للشحنة ${invoice.shipmentId.acid}`,
                            data: {
                                paymentId: payment._id,
                                shipmentId: invoice.shipmentId._id,
                                shipmentAcid: invoice.shipmentId.acid,
                                amount: transaction.amount,
                                actionUrl: `/employee/payments/${payment._id}`,
                            },
                            sendPush: true,
                            priority: "high",
                        });
                        console.log(`📬 Employee notified about payment upload for shipment: ${invoice.shipmentId.acid}`);
                    }
                }
            }
        } catch (notifError) {
            console.error("Failed to send employee payment notification:", notifError.message);
        }

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
        // Generate presigned URLs for payment receipt images
        const paymentsWithUrls = await generatePresignedUrlsForPayments(payments);
        res.json(paymentsWithUrls);
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

        // Generate presigned URLs for all payment images
        const summaryWithUrls = await Promise.all(summary.map(async (item) => {
            const paymentsWithUrls = await generatePresignedUrlsForPayments(item.payments);
            return { ...item, payments: paymentsWithUrls };
        }));

        res.json(summaryWithUrls);

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

        const oldStatus = transaction.status;
        transaction.status = status;

        await payment.save();

        // 📬 Send notification for payment status change
        if (status !== oldStatus && (status === 'APPROVED' || status === 'REJECTED')) {
            try {
                await notificationService.notifyPaymentStatus(
                    payment.userId,
                    payment._id,
                    status
                );
                console.log(`📬 Payment status notification (${status}) sent to user: ${payment.userId}`);
            } catch (notifError) {
                console.error("Failed to send payment status notification:", notifError.message);
            }
        }

        res.json(payment);

    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update payment receipt (for PENDING or REJECTED payments)
// @route   PATCH /api/payments/:paymentId/receipt
// @access  Private
const updatePaymentReceipt = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { imageUrls } = req.body;
        const userId = req.user.id;

        if (!imageUrls) {
            return res.status(400).json({ message: "Image URL is required" });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        // Check if user owns this payment
        if (payment.userId.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized to update this payment" });
        }

        // Check if the transaction is in PENDING or REJECTED status
        if (payment.transactions.length === 0) {
            return res.status(400).json({ message: "No transactions found" });
        }

        const transaction = payment.transactions[0]; // Usually first transaction
        if (transaction.status === 'APPROVED') {
            return res.status(400).json({ message: "Cannot update an approved receipt" });
        }

        // Update the receipt image and reset status to PENDING
        transaction.imageUrls = imageUrls;
        transaction.status = 'PENDING';

        await payment.save();

        // 📬 Send notification for re-uploaded receipt
        try {
            await notificationService.notifyPaymentReceiptUploaded(userId, payment._id);
            console.log(`📬 Updated receipt notification sent to user: ${userId}`);
        } catch (notifError) {
            console.error("Failed to send updated receipt notification:", notifError.message);
        }

        res.json({ 
            success: true,
            message: "Receipt updated successfully",
            payment 
        });

    } catch (error) {
        console.error("Error updating payment receipt:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    createPayment,
    getMyPayments,
    getAllPayments,
    getAdminFinancials,
    updateTransactionStatus,
    updateUserWallet,
    updatePaymentReceipt
};
