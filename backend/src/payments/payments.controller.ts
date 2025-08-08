// Path: backend/src/payments/payments.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ConfigService } from '@nestjs/config';

@Controller('payments')
export class PaymentsController {
  // --- PERUBAHAN DI SINI ---
  // Kita secara eksplisit menyatakan bahwa token ini bisa jadi 'string' atau 'undefined'.
  private readonly webhookToken: string | undefined;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {
    // Baris ini sekarang valid karena tipe datanya cocok.
    this.webhookToken = this.configService.get('XENDIT_WEBHOOK_TOKEN');
    
    // Memberi peringatan jika token tidak diatur di file .env
    if (!this.webhookToken) {
        this.logger.warn('XENDIT_WEBHOOK_TOKEN tidak diatur. Verifikasi webhook dilewati. INI TIDAK AMAN UNTUK PRODUKSI!');
    }
  }

  // Endpoint ini harus dilindungi karena hanya user yang login yang bisa membuat invoice.
  @UseGuards(AuthGuard('jwt'))
  @Post('create-invoice')
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.paymentsService.createInvoice(createInvoiceDto, user);
  }

  // Endpoint ini tidak memerlukan AuthGuard karena diakses oleh server Xendit.
  @Post('xendit-webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-callback-token') receivedToken: string,
    @Body() payload: any,
    @Res() res: Response,
  ) {
    // Validasi token hanya jika token diatur di server.
    if (this.webhookToken && receivedToken !== this.webhookToken) {
      throw new ForbiddenException('Webhook token tidak valid.');
    }

    // Jalankan proses webhook secara asynchronous agar bisa segera membalas Xendit.
    this.paymentsService.handleXenditWebhook(payload);
    
    // Balas segera untuk menghindari timeout dari Xendit.
    res.send({ message: 'Webhook diterima' });
  }

  // Tambahkan logger untuk best practice
  private readonly logger = {
    warn: (message: string) => console.warn(`[PaymentsController] ${message}`),
  };
}