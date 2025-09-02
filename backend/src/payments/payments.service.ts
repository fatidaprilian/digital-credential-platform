// Path: backend/src/payments/payments.service.ts

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Xendit } from 'xendit-node';

// Ambil API key dari environment variables
const XENDIT_API_KEY = process.env.XENDIT_API_KEY;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly xenditClient: Xendit;

  // Definisikan harga di satu tempat agar mudah dikelola
  private readonly CREDIT_PRICE = 50;
  private readonly SUBSCRIPTION_PRICE = 250000;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService, // Inject ConfigService untuk akses .env
  ) {
    if (!XENDIT_API_KEY) {
      throw new Error('XENDIT_API_KEY tidak ditemukan di environment variables.');
    }
    this.xenditClient = new Xendit({ secretKey: XENDIT_API_KEY });
  }

  async createInvoice(createInvoiceDto: CreateInvoiceDto, user: User) {
    const { itemType, quantity } = createInvoiceDto;

    if (!user.institutionId) {
      throw new BadRequestException('User tidak terhubung dengan institusi manapun.');
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: user.institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Institusi tidak ditemukan');
    }

    let amount: number;
    let description: string;
    const externalId = `inv-${institution.id}-${Date.now()}`;

    if (itemType === 'credits') {
      if (!quantity || quantity < 1) {
        throw new BadRequestException('Kuantitas harus diisi untuk pembelian kredit.');
      }
      amount = this.CREDIT_PRICE * quantity;
      description = `Pembelian ${quantity} kredit untuk ${institution.name}`;
    } else if (itemType === 'subscription') {
      amount = this.SUBSCRIPTION_PRICE;
      description = `Langganan Bulanan untuk ${institution.name}`;
    } else {
      throw new BadRequestException('Tipe item tidak valid.');
    }

    try {
      const { Invoice } = this.xenditClient;
      
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');

      const createInvoiceRequest = {
        externalId,
        amount,
        payerEmail: user.email,
        description,
        customer: {
          givenNames: institution.name,
          email: user.email,
        },
        invoiceDuration: 86400,
        currency: 'IDR',
        // --- PERUBAHAN DI SINI ---
        // Arahkan pengguna kembali ke dasbor dengan tab billing aktif.
        successRedirectUrl: `${frontendUrl}/issuer/dashboard?payment=success&tab=billing`,
        failureRedirectUrl: `${frontendUrl}/issuer/dashboard?payment=failed&tab=billing`,
      };

      const invoice = await Invoice.createInvoice({ data: createInvoiceRequest });

      if (!invoice.id || !invoice.invoiceUrl) {
        this.logger.error('Respons tidak valid dari Xendit:', invoice);
        throw new InternalServerErrorException('Gagal mendapatkan URL invoice dari Xendit.');
      }

      await this.prisma.paymentLog.create({
        data: {
          xenditId: invoice.id,
          amount,
          status: 'PENDING',
          description,
          institution: {
            connect: { id: institution.id },
          },
        },
      });

      this.logger.log(`Invoice ${invoice.id} dibuat untuk institusi ${institution.id}`);
      
      return { invoice_url: invoice.invoiceUrl };

    } catch (error) {
      this.logger.error('Gagal membuat invoice Xendit:', {
        message: error.message,
        stack: error.stack,
        ...error,
      });
      throw new InternalServerErrorException('Gagal membuat invoice pembayaran.');
    }
  }

  async handleXenditWebhook(payload: any) {
    const { id, status, paid_amount } = payload;

    this.logger.log(`Menerima webhook untuk Xendit ID: ${id} dengan status: ${status}`);

    const paymentLog = await this.prisma.paymentLog.findUnique({
      where: { xenditId: id },
    });

    if (!paymentLog) {
      this.logger.warn(`Payment log untuk Xendit ID ${id} tidak ditemukan.`);
      return;
    }
    
    if (status === 'PAID' && paymentLog.status !== 'SUCCESS') {
      const isSubscription = paymentLog.description?.toLowerCase().includes('langganan');

      await this.prisma.$transaction(async (tx) => {
        await tx.paymentLog.update({
          where: { id: paymentLog.id },
          data: { status: 'SUCCESS' },
        });

        if (isSubscription) {
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          await tx.institution.update({
            where: { id: paymentLog.institutionId },
            data: { subscriptionExpiresAt: expiryDate },
          });
          this.logger.log(`Langganan untuk institusi ${paymentLog.institutionId} telah diaktifkan.`);
        } else {
          const creditsToAdd = Math.floor(paid_amount / this.CREDIT_PRICE);
          await tx.institution.update({
            where: { id: paymentLog.institutionId },
            data: { issuanceCredits: { increment: creditsToAdd } },
          });
          this.logger.log(`${creditsToAdd} kredit ditambahkan ke institusi ${paymentLog.institutionId}.`);
        }
      });
    } else if (status !== 'PAID') {
      await this.prisma.paymentLog.update({
        where: { id: paymentLog.id },
        data: { status: status },
      });
      this.logger.log(`Status pembayaran untuk ${id} diupdate menjadi ${status}`);
    }
  }
}