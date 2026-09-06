const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Helper to parse cookies from raw cookie header
 */
const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });

  return list;
};

/**
 * Socket.IO Authentication Middleware
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = null;

    // 1. Extract token from handshake auth or query
    if (socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    } else if (socket.handshake.query?.token) {
      token = socket.handshake.query.token;
    }

    // 2. Extract token from cookies if not in auth
    if (!token && socket.request.headers.cookie) {
      const cookies = parseCookies(socket.request.headers.cookie);
      token = cookies.token || cookies.jwt;
    }

    if (!token) {
      logger.warn(`[Socket Auth] Connection rejected: No authentication token found (Socket ID: ${socket.id})`);
      return next(new Error('Authentication error: Token required to establish real-time session.'));
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_careerai_2026');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn(`[Socket Auth] Connection rejected: User not found for token ID ${decoded.id}`);
      return next(new Error('Authentication error: User does not exist.'));
    }

    // 4. Attach authenticated user to socket
    socket.user = user;
    socket.userId = user._id.toString();
    logger.info(`[Socket Auth] Authorized user: ${user.email} (ID: ${user._id}) on socket ${socket.id}`);
    next();
  } catch (error) {
    logger.error(`[Socket Auth] Verification error: ${error.message}`);
    next(new Error(`Authentication error: ${error.message}`));
  }
};

module.exports = socketAuthMiddleware;
