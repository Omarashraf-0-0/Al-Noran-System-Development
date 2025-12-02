const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  addUsers,
  getNotifications,
  sendNotification,
  contactUs
} = require('../controllers/userController');

const { phoneNumberValidation } = require('../middleware/validation');


// Base routes for user operations
router.route('/')
  .get(getAllUsers)
  .post(createUser);

// Batch user creation
router.route('/addUsers')
  .post(addUsers);

// User-specific operations
router.route('/:id')
  .patch(updateUser)
  .put(updateUser) // Add PUT support for mobile app
  .delete(deleteUser);

// Password management
router.route('/:id/change-password')
  .put(changePassword);

router.route('/notifications/sendNotification').post(sendNotification)
router.route('/notifications/getAllNotifications').get(getNotifications)
router.route('/contactUs/sendMail').post(phoneNumberValidation,contactUs);

module.exports = router;
