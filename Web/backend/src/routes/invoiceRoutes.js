const express = require('express');
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
    addInvoice,
    saveInvoices,
    getAllInvoices,
    getMyInvoices,
    updateInvoiceItem,
    payInvoice
} = require('../controllers/invoiceController');


router.post('/addInvoice', addInvoice);

router.post('/saveInvoices', saveInvoices);

router.get('/getAllInvoices', getAllInvoices);

router.get('/my-invoices', protect, getMyInvoices);

router.put('/:id/item', protect, updateInvoiceItem);
router.post('/:id/pay', protect, payInvoice);

module.exports = router;