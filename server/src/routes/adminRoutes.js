const express = require('express');
const {
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getUserHistory
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

// Admin-only route protection
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/history', getUserHistory);

module.exports = router;
