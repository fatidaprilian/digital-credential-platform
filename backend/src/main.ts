// Path: backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Menggunakan ValidationPipe secara global untuk semua endpoint.
  // Ini adalah praktik terbaik untuk memastikan semua data masuk (DTO)
  // divalidasi secara otomatis.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Mengabaikan properti yang tidak didefinisikan di DTO.
    forbidNonWhitelisted: true, // Melempar error jika ada properti yang tidak seharusnya.
    transform: true, // Secara otomatis mengubah payload menjadi instance DTO.
  }));

  // Menambahkan prefix global '/api' untuk semua endpoint.
  // Contoh: /auth/signin menjadi /api/auth/signin
  app.setGlobalPrefix('api');

  // Mengaktifkan CORS (Cross-Origin Resource Sharing) dengan konfigurasi spesifik.
  // Ini akan mengizinkan frontend di http://localhost:3000 untuk berkomunikasi
  // dengan backend ini.
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Backend akan berjalan di port 3001, sesuai dengan konfigurasi di docker-compose.yml
  await app.listen(3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
