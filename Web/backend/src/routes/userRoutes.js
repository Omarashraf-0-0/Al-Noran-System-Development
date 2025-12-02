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
  getUserProfile,
  updateUserProfile,
  changePasswordProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Profile routes (protected)
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/change-password')
  .put(protect, changePasswordProfile);

// User management routes
router.route('/getAll')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id/change-password')
  .put(changePassword);

router.route('/:id')
  .patch(updateUser)
  .put(updateUser) // Add PUT support for mobile app
  .delete(deleteUser);

router.route('/addUsers')
  .post(addUsers);

router.route('/notifications/sendNotification').post(sendNotification)
router.route('/notifications/getAllNotifications').get(getNotifications)


module.exports = router;
