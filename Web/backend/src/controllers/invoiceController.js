const Invoice = require('../models/invoice');

const addInvoice = async (req, res) => {
  try {
    
    const invoice = new Invoice(req.body);
    const savedInvoice = await invoice.save();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: savedInvoice,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Invoice number already exists." });
    }

    res.status(400).json({
      message: "Invalid invoice data",
      error: error.message,
    });
  }
};




const saveInvoices = async (req,res) => {

    const invoicesData = req.body;

    if(!Array.isArray(invoicesData))
    {
        return res.status(400).json({ message: 'Expected an array of invoices' });
    }

    try{
        const invoices = await Invoice.insertMany(invoicesData,{ ordered: false });
        
        res.status(201).json({
            message: `${invoices.length} invoices saved successfully`,
            invoices,
        });
      } catch (error) {
        //console.error(error);
        return res.status(500).json({
            error: 'Failed to save invoices',
            details: error.writeErrors || error.message,
        });
    }

};




const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found' });
    }

    return res.status(200).json({
      message: 'Invoices fetched successfully',
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};



module.exports = { addInvoice , saveInvoices , getAllInvoices};
