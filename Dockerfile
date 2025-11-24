# Dockerfile for Railway - with Node.js and optional Ollama
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-5000}

# Start command
CMD ["node", "index.js"]

