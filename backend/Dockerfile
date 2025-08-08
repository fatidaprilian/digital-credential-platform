# Gunakan base image Node.js versi 20 dengan Alpine Linux
FROM node:20-alpine

# Set direktori kerja di dalam container, sesuai dengan Dockerfile Anda
WORKDIR /usr/src/app

# ====================================================================================
# REVISI UTAMA: Install dependensi sistem yang dibutuhkan oleh 'node-canvas'
# Ini adalah langkah yang tidak ada di Dockerfile Anda dan menjadi penyebab error.
#
# - python3: Dibutuhkan oleh node-gyp untuk meng-compile native addon seperti 'canvas'.
# - build-base: Kumpulan alat kompilasi dasar (make, g++, gcc).
# - cairo-dev: Library untuk menggambar grafis 2D.
# - pango-dev: Library untuk layout dan rendering teks.
# - jpeg-dev, giflib-dev: Untuk dukungan format gambar tambahan.
# - ttf-dejavu: Paket font yang akan kita gunakan di dalam kode.
# ====================================================================================
RUN apk add --no-cache python3 build-base cairo-dev pango-dev jpeg-dev giflib-dev ttf-dejavu

# Copy file package.json dan package-lock.json terlebih dahulu
# Ini memanfaatkan Docker cache agar tidak 'npm install' setiap ada perubahan kode
COPY package*.json ./

# ====================================================================================
# Install dependencies, termasuk 'canvas' yang akan di-compile di sini.
# Perintah ini sekarang akan berhasil karena semua alat yang dibutuhkan sudah di-install di atas.
# ====================================================================================
RUN npm install

# ===================================================================
#   INI ADALAH PERBAIKAN UTAMA:
#   Paksa generate Prisma Client setelah instalasi
# ===================================================================
RUN npx prisma generate

# Copy sisa kode aplikasi.
# Dalam setup Anda dengan volume, ini lebih sebagai fallback.
COPY . .

# Expose port yang digunakan oleh aplikasi NestJS
EXPOSE 3001

# Perintah default untuk menjalankan aplikasi dalam mode development.
# Ini akan di-override oleh 'command' di docker-compose.yml, tapi baik untuk dimiliki.
CMD ["npm", "run", "start:dev"]
