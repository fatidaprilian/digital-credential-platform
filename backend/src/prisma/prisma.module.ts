// backend/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <-- Jadikan modul ini Global
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Ekspor service agar bisa di-inject di mana saja
})
export class PrismaModule {}