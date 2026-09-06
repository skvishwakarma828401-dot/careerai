const User = require('../models/User');
const { sendTokenResponse } = require('../utils/tokenUtils');
const logger = require('../utils/logger');

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, targetRole, experienceLevel, skills, bio } = req.body;

    // Validate required fields and string types
    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid text for full name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Construct profile sub-document if provided
    const profile = {
      targetRole: targetRole || 'Full Stack Developer',
      experienceLevel: experienceLevel || 'beginner',
      skills: Array.isArray(skills) ? skills : skills ? [skills] : [],
      bio: bio || '',
    };

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'student',
      profile,
    });

    logger.info(`User registered successfully: ${user.email} (${user._id})`);
    sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Login user with email & password
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password presence and string types
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide both valid email and password strings.',
      });
    }

    // Check for user and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    logger.info(`User logged in: ${user.email} (${user._id})`);
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Log user out and clear HTTP-only cookie
 * @route POST /api/auth/logout
 * @access Public
 */
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000), // expire in 5 seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully. Session cleared.',
  });
};

/**
 * @desc Get currently authenticated user details
 * @route GET /api/auth/me
 * @access Private (Protected)
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
