

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
  const { email, password } = req.body;

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

    if (user && (await userService.matchPassword(email, password))) {
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

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
};
