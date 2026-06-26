# ============================================
# FoodChain AI - Frontend Dockerfile
# ============================================

FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Development server
CMD ["npm", "run", "dev"]
