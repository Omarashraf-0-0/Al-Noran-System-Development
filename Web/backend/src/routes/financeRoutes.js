const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

// إنشاء سجل مالي جديد لشحنة
router.post('/:acid/create', financeController.createFinanceRecord);

// إضافة فاتورة
router.post('/:acid/invoice', financeController.addInvoice);

// إضافة دفعة مالية
router.post('/:acid/payment', financeController.addPayment);

// جلب كل الفواتير والمدفوعات
router.get('/:acid/details', financeController.getFinanceDetails);

module.exports = router;
