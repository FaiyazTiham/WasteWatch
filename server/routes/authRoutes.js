const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/demo-login/:role', authController.demoLogin);

// Protected
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, upload.single('avatar'), authController.updateProfile);
router.put('/change-password', requireAuth, authController.changePassword);
router.get('/my-reports', requireAuth, authController.getMyReports);

module.exports = router;
