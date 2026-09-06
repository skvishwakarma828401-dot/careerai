require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initWorkers } = require('./src/workers/jobWorker');
const socketAuthMiddleware = require('./src/socket/socketAuth');
const { registerInterviewSocketHandlers } = require('./src/socket/interviewSocket');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Initialize BullMQ Background Workers
initWorkers();

// Create HTTP and WebSocket Servers
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 25000,
});

// Register Socket.IO Authentication Middleware
io.use(socketAuthMiddleware);

// Register Real-Time Interview Event Handlers
registerInterviewSocketHandlers(io);

// Start Server
server.listen(PORT, () => {
  logger.info(`CareerAI Backend, Socket.IO & BullMQ Workers running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  logger.info(`Health check endpoint: http://localhost:${PORT}/api/health`);
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = { app, server, io };
