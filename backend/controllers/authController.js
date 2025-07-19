

// backend/controllers/authController.js
const userService = require('../services/userService');
const generateToken = require('../utils/generateToken');
const { body, validationResult } = require('express-validator');

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation: minimum 8 chars, at least one uppercase, one lowercase, one number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Enhanced Input Validation
  if (!name || !email || !password) {
    res.status(400);
    return next(new Error('Please add all fields: name, email, password'));
  }
  
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400);
    return next(new Error('Name, email, and password must be strings.'));
  }
  
  // Email format validation
  if (!EMAIL_REGEX.test(email)) {
    res.status(400);
    return next(new Error('Please provide a valid email address.'));
  }
  
  // Password strength validation
  if (!PASSWORD_REGEX.test(password)) {
    res.status(400);
    return next(new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.'));
  }
  
  // Name validation (alphanumeric and spaces only, 2-50 chars)
  if (!/^[a-zA-Z0-9\s]{2,50}$/.test(name)) {
    res.status(400);
    return next(new Error('Name must be 2-50 characters long and contain only letters, numbers, and spaces.'));
  }
  
  if (role && typeof role !== 'string') {
     res.status(400);
     return next(new Error('Role must be a string if provided.'));
  }

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

  // Enhanced Input Validation
  if (!email || !password) {
    res.status(400);
    return next(new Error('Please provide email and password'));
  }
  
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400);
    return next(new Error('Email and password must be strings.'));
  }
  
  // Email format validation
  if (!EMAIL_REGEX.test(email)) {
    res.status(400);
    return next(new Error('Please provide a valid email address.'));
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

// @desc    Public password reset (forgot password) - REMOVED FOR SECURITY
// This endpoint is a security risk and should be replaced with a proper
// email-based password reset flow
const resetPasswordPublic = async (req, res, next) => {
  res.status(501).json({ 
    message: 'Password reset via API is disabled for security reasons. Please contact your administrator.' 
  });
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  resetPasswordPublic,
};
