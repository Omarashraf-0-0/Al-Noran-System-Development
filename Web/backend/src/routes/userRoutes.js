const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

router.route('/getAll')
  .get(getAllUsers)
  .post(createUser);
router.route('/:id')
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
