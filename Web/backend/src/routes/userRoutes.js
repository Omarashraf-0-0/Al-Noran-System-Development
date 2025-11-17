const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  addUsers
} = require('../controllers/userController');

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

module.exports = router;
