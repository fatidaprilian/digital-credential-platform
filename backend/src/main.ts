// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Mengaktifkan validasi global
  app.useGlobalPipes(new ValidationPipe());

  // AKTIFKAN CORS DI SINI
  app.enableCors();

  await app.listen(3001);
}
bootstrap();