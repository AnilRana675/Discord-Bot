# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev || npm install --only=production

# Copy the rest of the application code
COPY src/ ./src/

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001 -G nodejs

# Change ownership of the app directory to the botuser
RUN chown -R botuser:nodejs /app

USER botuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/ping', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Expose the port (if needed for health checks)
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
