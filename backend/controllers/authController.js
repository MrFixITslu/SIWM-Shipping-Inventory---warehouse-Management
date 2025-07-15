

// backend/controllers/authController.js
const userService = require('../services/userService');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Basic Input Validation
  if (!name || !email || !password) {
    res.status(400);
    return next(new Error('Please add all fields: name, email, password'));
  }
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400);
    return next(new Error('Name, email, and password must be strings.'));
  }
  if (role && typeof role !== 'string') {
     res.status(400);
     return next(new Error('Role must be a string if provided.'));
  }
  // Add email format validation if desired

  try {
    const userExists = await userService.findUserByEmail(email);
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists'));
    }

    const user = await userService.createUser({ name, email, password, role });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: generateToken(user.id),
      });
    } else {
      res.status(400);
      return next(new Error('Invalid user data during registration'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/v1/auth/login
// @access  Public
const authUser = async (req, res, next) => {
  // Trim and lowercase the email for consistent lookup
  const rawEmail = req.body.email;
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
  const password = req.body.password;

  // Basic Input Validation
  if (!email || !password) {
    res.status(400);
    return next(new Error('Please provide email and password'));
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400);
    return next(new Error('Email and password must be strings.'));
  }

  try {
    const user = await userService.findUserByEmail(email);
    const passwordProvided = !!password;
    let passwordMatch = false;
    if (user && passwordProvided) {
      passwordMatch = await userService.matchPassword(email, password);
    }

    if (user && passwordMatch) {
      // Log successful login with IP address for security monitoring
      const clientIP = req.clientIP || req.ip || 'unknown';
      console.log(`Successful login: ${email} from IP: ${clientIP}`);
      
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: generateToken(user.id),
      });
    } else {
      // Log failed login attempt with IP address
      const clientIP = req.clientIP || req.ip || 'unknown';
      console.log(`Failed login attempt: ${email} from IP: ${clientIP}`);
      
      res.status(401); // Unauthorized
      return next(new Error('Invalid email or password'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.user.id); 

    if (user) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      });
    } else {
      res.status(404);
      return next(new Error('User not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Public password reset (forgot password)
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPasswordPublic = async (req, res, next) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || typeof email !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400);
    return next(new Error('Email and a new password (min 6 chars) are required.'));
  }
  try {
    const user = await userService.findUserByEmail(email);
    if (!user) {
      // For security, do not reveal if the email exists
      return res.status(200).json({ message: 'If the email exists, the password has been reset.' });
    }
    const salt = await require('bcryptjs').genSalt(10);
    const hashedPassword = await require('bcryptjs').hash(newPassword, salt);
    await require('../config/db').getPool().query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    return res.status(200).json({ message: 'If the email exists, the password has been reset.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  resetPasswordPublic,
};
