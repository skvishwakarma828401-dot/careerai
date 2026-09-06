# ==============================================================================
# CareerAI Backend Dockerfile (Node.js 20 Alpine Production Container)
# ==============================================================================

FROM node:20-alpine AS base

# Install curl/wget for container health checks
RUN apk add --no-cache wget curl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    PORT=5000

# Install dependencies (utilizing layer caching)
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy application source code
COPY . .

# Set ownership to non-root node user for container security
RUN chown -R node:node /app
USER node

# Expose HTTP and WebSocket port
EXPOSE 5000

# Container Health Check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the Backend Server with Socket.IO and BullMQ Workers
CMD ["node", "server.js"]
