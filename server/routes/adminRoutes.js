const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All admin routes require admin or staff roles
router.get('/analytics', requireAuth, requireRole(['admin', 'cleanup_staff']), adminController.getAnalytics);
router.get('/staff', requireAuth, requireRole(['admin', 'cleanup_staff']), adminController.getStaffList);

// Admin-only operations
router.get('/users', requireAuth, requireRole('admin'), adminController.getAllUsers);
router.put('/users/:userId/role', requireAuth, requireRole('admin'), adminController.updateUserRole);
router.put('/users/:userId/ban', requireAuth, requireRole('admin'), adminController.toggleUserBan);

// Category Management
router.post('/categories', requireAuth, requireRole('admin'), adminController.createCategory);

// Moderation
router.get('/flags', requireAuth, requireRole('admin'), adminController.getModerationFlags);
router.post('/flags/:flagId/resolve', requireAuth, requireRole('admin'), adminController.resolveFlag);

module.exports = router;
