// Path: backend/src/payments/payments.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <-- DIIMPOR
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [ConfigModule], // <-- DITAMBAHKAN DI SINI
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}