const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'careerai_default_secret_key_change_in_production',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

/**
 * Create token, set secure HTTP-only cookie, and send unified JSON response
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role);

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 30;
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  };

  // Convert to object and omit password
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token, // Also return token for clients that prefer Bearer header
      user: userResponse,
    });
};

module.exports = {
  generateToken,
  sendTokenResponse,
};
