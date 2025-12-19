const Invoice = require('../models/invoice');
const notificationService = require('../services/notificationService');

const addInvoice = async (req, res) => {
  try {

    const invoice = new Invoice(req.body);
    const savedInvoice = await invoice.save();

    // 📬 Send notification for new invoice
    if (savedInvoice.userId) {
      try {
        // Calculate total
        let total = 0;
        savedInvoice.invoiceItems.forEach(item => {
          if (item.currencyType === "USD") {
            total += item.itemPrice * 50;
          } else {
            total += item.itemPrice;
          }
        });
        
        await notificationService.notifyInvoiceCreated(
          savedInvoice.userId,
          savedInvoice._id,
          savedInvoice.invoiceNumber,
          total
        );
        console.log(`📬 Invoice creation notification sent to user: ${savedInvoice.userId}`);
      } catch (notifError) {
        console.error("Failed to send invoice notification:", notifError.message);
      }
    }

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




const saveInvoices = async (req, res) => {

  const invoicesData = req.body;

  if (!Array.isArray(invoicesData)) {
    return res.status(400).json({ message: 'Expected an array of invoices' });
  }

  try {
    const invoices = await Invoice.insertMany(invoicesData, { ordered: false });

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

// @desc    Get logged in user invoices
// @route   GET /api/invoice/my-invoices
// @access  Private
const getMyInvoices = async (req, res) => {
  try {
    // userId from auth middleware (req.user)
    const userId = req.user.id;
    console.log(`Fetching invoices for User ID: ${userId}`);

    // Find invoices where userId matches
    const invoices = await Invoice.find({ userId }).sort({ createdAt: -1 });

    console.log(`Found ${invoices.length} invoices for user ${userId}`);

    // Return array directly to match frontend expectation in ClientPaymentsPage
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching my invoices:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const updateInvoiceItem = async (req, res) => {
  const { id } = req.params;
  const { itemId, newPrice } = req.body;

  try {
    console.log(`[UpdateInvoice] InvoiceID: ${id}, ItemID: ${itemId}, NewPrice: ${newPrice}`);

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const item = invoice.invoiceItems.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.itemPrice = newPrice;
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    console.error("Error updating invoice item:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const User = require('../models/user');

const payInvoice = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From auth middleware

  try {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to pay this invoice" });
    }

    if (invoice.status === "تم الدفع") {
      return res.status(400).json({ message: "Invoice already paid" });
    }

    // Calculate Total
    let totalAmountEGP = 0;
    invoice.invoiceItems.forEach(item => {
      if (item.currencyType === "USD") {
        totalAmountEGP += item.itemPrice * 50;
      } else {
        totalAmountEGP += item.itemPrice;
      }
    });

    const user = await User.findById(userId);
    if (user.wallet < totalAmountEGP) {
      return res.status(400).json({ message: "Insufficient funds in wallet" });
    }

    // Deduct from wallet and update invoice
    user.wallet -= totalAmountEGP;
    await user.save();

    invoice.status = "تم الدفع";
    await invoice.save();

    // 📬 Send notification for successful payment
    try {
      await notificationService.notifyInvoicePaid(
        userId,
        invoice._id,
        invoice.invoiceNumber
      );
      console.log(`📬 Invoice paid notification sent to user: ${userId}`);
    } catch (notifError) {
      console.error("Failed to send invoice paid notification:", notifError.message);
    }

    res.json({ message: "Payment successful", invoice, newBalance: user.wallet });

  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { addInvoice, saveInvoices, getAllInvoices, getMyInvoices, updateInvoiceItem, payInvoice };

