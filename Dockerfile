# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY src/ ./src/

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001
USER botuser

# Expose the port (if needed for health checks)
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
