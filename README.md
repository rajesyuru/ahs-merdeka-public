# Aplikasi Aqua Home Service

Ini adalah aplikasi untuk AHS.

## Cara instalasi

1. Salin file `.env.example` ke `.env`
2. Ubah `.env` sesuai konfigurasi lokal anda
3. Jalankan `npm install`
4. Jalankan migration dengan `npx sequelize-cli db:migrate`
5. Jalankan seeder dengan `npx sequelize-cli db:seed:all`
