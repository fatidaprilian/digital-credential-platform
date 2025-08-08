# Gunakan base image Node.js versi 20 dengan Alpine Linux
FROM node:20-alpine

# Set working directory
WORKDIR /app

# ====================================================================================
# REVISI: Tambahkan dependensi sistem untuk meng-compile 'canvas'
# Sama seperti di backend, frontend juga membutuhkan ini karena salah satu
# library-nya memiliki 'canvas' sebagai sub-dependency.
# ====================================================================================
RUN apk add --no-cache python3 build-base cairo-dev pango-dev jpeg-dev giflib-dev

# Copy package files
COPY package*.json ./

# Install dependencies
# Perintah ini sekarang akan berhasil karena python3 dan library lain sudah ada.
RUN npm install

# Kode aplikasi akan di-mount via volume
# Next.js dev server akan dijalankan oleh Docker
