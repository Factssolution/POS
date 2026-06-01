# Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend code
COPY . .

# Create directories
RUN mkdir -p uploads backups

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "server.js"]
