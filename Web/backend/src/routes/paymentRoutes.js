const express = require("express");
const router = express.Router();
const {
    createPayment,
    getMyPayments,
    getAllPayments,
    getAdminFinancials,
    updateTransactionStatus,
    updateUserWallet,
    updatePaymentReceipt
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.route("/")
    .post(protect, createPayment)
    .get(protect, getAllPayments); // Admin check suggested

router.get("/my-payments", protect, getMyPayments);
router.get("/admin/summary", protect, getAdminFinancials);
router.patch("/:paymentId/transactions/:transactionId", protect, updateTransactionStatus);
router.patch("/:paymentId/receipt", protect, updatePaymentReceipt);
router.put("/users/:userId/wallet", protect, updateUserWallet);

module.exports = router;
