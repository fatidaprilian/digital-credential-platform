# backend/Dockerfile
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /usr/src/app

# Copy package.json dan package-lock.json terlebih dahulu
# Ini memanfaatkan Docker cache agar tidak 'npm install' setiap ada perubahan kode
COPY package*.json ./

# Install dependencies
RUN npm install

# Sisanya akan di-mount dari local machine menggunakan volume di docker-compose.yml
# Perintah untuk menjalankan aplikasi juga ada di docker-compose.yml