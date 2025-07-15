// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, resetPasswordPublic } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
router.post('/register', registerUser);

// @desc    Auth user & get token (Login)
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', authUser);

// @desc    Public password reset
// @route   POST /api/v1/auth/reset-password
// @access  Public
router.post('/reset-password', resetPasswordPublic);

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
// @access  Private
router.get('/profile', protect, getUserProfile);

module.exports = router;
