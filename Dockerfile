FROM node:18-alpine

# Cipta direktori aplikasi
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Pasang dependencies (Hanya untuk production)
RUN npm install --production

# Salin semua fail kod (kecuali yang dihalang oleh .dockerignore)
COPY . .

# Dedahkan port yang digunakan oleh aplikasi
EXPOSE 3000

# Perintah untuk menjalankan aplikasi menggunakan kluster PM2 (jika menggunakan docker pm2)
# Namun secara default untuk docker biasa, kita gunakan fail permulaan biasa:
CMD ["npm", "run", "dev"]
