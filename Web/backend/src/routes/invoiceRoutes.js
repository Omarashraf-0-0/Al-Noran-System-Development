const express = require('express');
const router = express.Router();
const {
    addInvoice , 
    saveInvoices,
    getAllInvoices
} = require('../controllers/invoiceController');


router.post('/addInvoice',addInvoice);

router.post('/saveInvoices',saveInvoices);

router.get('/getAllInvoices',getAllInvoices);

module.exports = router;