const express = require('express');
const router = express.Router();

// API root endpoint - returns JSON for deployed API server
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Al-Noran API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            shipments: '/api/shipments',
            uploads: '/api/uploads',
            chat: '/api/chat',
            payments: '/api/payments',
            ucr: '/api/ucr',
            exportShipments: '/api/export-shipments',
            notifications: '/api/notifications'
        }
    });
});

module.exports = router;
``