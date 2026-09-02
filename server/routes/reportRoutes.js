const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Stats & Categories
router.get('/stats', reportController.getPublicStats);
router.get('/categories', reportController.getCategories);

// Reports query & single report
router.get('/', optionalAuth, reportController.getReports);
router.get('/:id', optionalAuth, reportController.getReportById);

// Submit report
router.post('/', requireAuth, upload.array('photos', 5), reportController.createReport);

// Update status (Admin / Cleanup Staff)
router.put('/:id/status', requireAuth, requireRole(['admin', 'cleanup_staff']), upload.single('cleaned_photo'), reportController.updateReportStatus);

// Delete report
router.delete('/:id', requireAuth, reportController.deleteReport);

// Upvote & Comment
router.post('/:id/upvote', requireAuth, reportController.toggleUpvote);
router.post('/:id/comments', requireAuth, reportController.addComment);

// Flag inappropriate
router.post('/:id/flag', requireAuth, reportController.flagReport);

module.exports = router;
