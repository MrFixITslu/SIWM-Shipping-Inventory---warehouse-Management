

// backend/controllers/userController.js
const userService = require('../services/userService');
const auditLogService = require('../services/auditLogService');
const { USER_GROUPS } = require('../config/roles');

// @desc    Get users with filtering
// @route   GET /api/v1/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
    try {
        // Filters from query string, e.g., /users?status=active&role=user
        const filters = {
            status: req.query.status,
            role: req.query.role,
            searchTerm: req.query.searchTerm
        };
        const users = await userService.getUsers(filters);
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new user
// @route   POST /api/v1/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
    const { name, email, password, role, contactNumber, permissions } = req.body;
    if (!name || !email || !password || !role) {
        res.status(400);
        return next(new Error('Name, email, password, and role are required.'));
    }
    if (!USER_GROUPS.includes(role)) {
        res.status(400);
        return next(new Error(`Invalid role provided. Must be one of: ${USER_GROUPS.join(', ')}`));
    }
    try {
        const actingAdminId = req.user.id;
        const newUser = await userService.createUser({ name, email, password, role, contactNumber, permissions }, actingAdminId);
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a user's details (role, permissions)
// @route   PUT /api/v1/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    const { role, permissions } = req.body;
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID.' });
    if (!role && !permissions) {
        res.status(400);
        return next(new Error('No data provided to update. Provide role and/or permissions.'));
    }
     if (role && !USER_GROUPS.includes(role)) {
        res.status(400);
        return next(new Error(`Invalid role provided. Must be one of: ${USER_GROUPS.join(', ')}`));
    }
    try {
        const actingAdminId = req.user.id;
        const updatedUser = await userService.updateUser(userId, { role, permissions }, actingAdminId);
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a user's status (activate/deactivate)
// @route   PUT /api/v1/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID.' });
    if (!status || !['active', 'inactive'].includes(status)) {
        res.status(400);
        return next(new Error("Status must be 'active' or 'inactive'."));
    }
    try {
        const actingAdminId = req.user.id;
        const updatedUser = await userService.updateUserStatus(userId, status, actingAdminId);
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a user's group/role
// @route   PUT /api/v1/users/:id/group
// @access  Private (Admin)
const updateUserGroup = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID.' });
    if (!role || !USER_GROUPS.includes(role)) {
        res.status(400);
        return next(new Error(`A valid role is required. Must be one of: ${USER_GROUPS.join(', ')}`));
    }
    try {
        const actingAdminId = req.user.id;
        const updatedUser = await userService.updateUserGroup(userId, role, actingAdminId);
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// @desc    Reset a user's password
// @route   PUT /api/v1/users/:id/reset-password
// @access  Private (Admin)
const resetPassword = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;
     if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID.' });
    if (!newPassword || newPassword.length < 6) {
        res.status(400);
        return next(new Error('A new password with at least 6 characters is required.'));
    }
    try {
        const actingAdminId = req.user.id;
        const result = await userService.resetPassword(userId, newPassword, actingAdminId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID.' });
    try {
        const actingAdminId = req.user.id;
        const result = await userService.deleteUser(userId, actingAdminId);
        if (result.success) {
            res.status(204).send(); // No Content
        }
    } catch (error) {
        next(error);
    }
};

const getAuditLogsForUser = async (req, res, next) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID.' });
    try {
        const logs = await auditLogService.getAuditLogsForUser(userId);
        res.json(logs);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    updateUserStatus,
    updateUserGroup,
    resetPassword,
    deleteUser,
    getAuditLogsForUser,
};