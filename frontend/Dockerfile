# frontend/Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Kode aplikasi akan di-mount via volume
# Next.js dev server akan dijalankan oleh Docker