

// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getUsers,
    createUser,
    updateUser,
    updateUserStatus,
    updateUserGroup,
    resetPassword,
    deleteUser,
    getAuditLogsForUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { ALL_ROLES } = require('../config/roles');

// All routes in this file require a user to be authenticated.
router.use(protect);

// @desc    Get all users (with filters) or create a new user
// @route   GET /api/v1/users, POST /api/v1/users
// @access  Private (GET for All Roles, POST for Admin)
router.route('/')
    .get(authorize(...ALL_ROLES), getUsers)
    .post(authorize('admin'), createUser);

// @desc    Update a user's details (role, permissions)
// @route   PUT /api/v1/users/:id
// @access  Private (Admin)
router.put('/:id', authorize('admin'), updateUser);

// @desc    Update user status
// @route   PUT /api/v1/users/:id/status
// @access  Private (Admin)
router.put('/:id/status', authorize('admin'), updateUserStatus);

// @desc    Update user group/role
// @route   PUT /api/v1/users/:id/group
// @access  Private (Admin)
router.put('/:id/group', authorize('admin'), updateUserGroup);

// @desc    Reset user password
// @route   PUT /api/v1/users/:id/reset-password
// @access  Private (Admin)
router.put('/:id/reset-password', authorize('admin'), resetPassword);

// @desc    Get audit logs for a specific user
// @route   GET /api/v1/users/audit-log/:userId
// @access  Private (Admin)
router.get('/audit-log/:userId', authorize('admin'), getAuditLogsForUser);

// @desc    Delete a user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), deleteUser);


module.exports = router;