// ============================================
// ملف: Web/backend/src/routes/shipmentRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  deleteShipment,
  trackShipment,
  getUserShipments,
  getUserStatistics,
  getRecentShipments
} = require('../controllers/shipmentController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/track/:trackingNumber', trackShipment);

// Protected routes (تحتاج authentication)
router.use(protect); // كل الـ routes اللي تحت محمية

router.route('/')
  .get(getAllShipments)
  .post(createShipment);

router.route('/:id')
  .get(getShipmentById)
  .patch(updateShipment)
  .delete(deleteShipment);

// User specific routes
router.get('/user/:userId', getUserShipments);
router.get('/user/:userId/statistics', getUserStatistics);
router.get('/user/:userId/recent', getRecentShipments);

module.exports = router;


// ============================================
// ملف: Web/backend/src/models/Shipment.js
// ============================================
const mongoose = require('mongoose');

const ShipmentUpdateSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ShipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  polNumber: {
    type: String, // رقم البوليصة
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    name: {
      type: String,
      required: true,
    },
    phone: String,
    address: String,
  },
  receiver: {
    name: {
      type: String,
      required: true,
    },
    phone: String,
    address: String,
  },
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'on_hold'],
    default: 'pending',
  },
  shipmentType: {
    type: String,
    enum: ['sea', 'air', 'land'],
    required: true,
  },
  weight: {
    type: Number,
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  estimatedDelivery: {
    type: Date,
  },
  actualDelivery: {
    type: Date,
  },
  notes: {
    type: String,
  },
  updates: [ShipmentUpdateSchema],
}, {
  timestamps: true,
});

// Generate tracking number automatically
ShipmentSchema.pre('save', async function(next) {
  if (!this.trackingNumber) {
    const prefix = this.shipmentType === 'sea' ? 'SEA' : this.shipmentType === 'air' ? 'AIR' : 'LAND';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.trackingNumber = `${prefix}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Shipment', ShipmentSchema);


// ============================================
// ملف: Web/backend/src/controllers/shipmentController.js
// ============================================
const Shipment = require('../models/Shipment');
const User = require('../models/user');

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Private
exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate('user', 'fullname email phone')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الشحنات',
      error: error.message,
    });
  }
};

// @desc    Get shipment by ID
// @route   GET /api/shipments/:id
// @access  Private
exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('user', 'fullname email phone');
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'الشحنة غير موجودة',
      });
    }
    
    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الشحنة',
      error: error.message,
    });
  }
};

// @desc    Track shipment by tracking number
// @route   GET /api/shipments/track/:trackingNumber
// @access  Public
exports.trackShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ 
      trackingNumber: req.params.trackingNumber.toUpperCase() 
    }).populate('user', 'fullname phone');
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الشحنة',
      });
    }
    
    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تتبع الشحنة',
      error: error.message,
    });
  }
};

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Private
exports.createShipment = async (req, res) => {
  try {
    const shipment = await Shipment.create({
      ...req.body,
      user: req.user._id, // من الـ auth middleware
    });
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الشحنة بنجاح',
      data: shipment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'خطأ في إنشاء الشحنة',
      error: error.message,
    });
  }
};

// @desc    Update shipment
// @route   PATCH /api/shipments/:id
// @access  Private
exports.updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'الشحنة غير موجودة',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث الشحنة بنجاح',
      data: shipment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'خطأ في تحديث الشحنة',
      error: error.message,
    });
  }
};

// @desc    Delete shipment
// @route   DELETE /api/shipments/:id
// @access  Private
exports.deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'الشحنة غير موجودة',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم حذف الشحنة بنجاح',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الشحنة',
      error: error.message,
    });
  }
};

// @desc    Get user shipments
// @route   GET /api/shipments/user/:userId
// @access  Private
exports.getUserShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({ user: req.params.userId })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب شحنات المستخدم',
      error: error.message,
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/shipments/user/:userId/statistics
// @access  Private
exports.getUserStatistics = async (req, res) => {
  try {
    const allShipments = await Shipment.find({ user: req.params.userId });
    
    const statistics = {
      totalShipments: allShipments.length,
      activeShipments: allShipments.filter(s => 
        ['in_transit', 'out_for_delivery', 'picked_up'].includes(s.status)
      ).length,
      completedShipments: allShipments.filter(s => s.status === 'delivered').length,
      pendingShipments: allShipments.filter(s => s.status === 'pending').length,
      cancelledShipments: allShipments.filter(s => s.status === 'cancelled').length,
      onHoldShipments: allShipments.filter(s => s.status === 'on_hold').length,
    };
    
    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات المستخدم',
      error: error.message,
    });
  }
};

// @desc    Get recent shipments for user
// @route   GET /api/shipments/user/:userId/recent
// @access  Private
exports.getRecentShipments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const shipments = await Shipment.find({ user: req.params.userId })
      .sort('-createdAt')
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الشحنات الأخيرة',
      error: error.message,
    });
  }
};


// ============================================
// ملف: Web/backend/src/middleware/authMiddleware.js
// ============================================
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك بالوصول لهذا المسار',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك بالوصول لهذا المسار',
    });
  }
};


// ============================================
// تحديث ملف: Web/backend/src/server.js
// ============================================
// أضف هذا السطر بعد الـ routes الموجودة:
app.use('/api/shipments', require('./routes/shipmentRoutes'));
