import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT');
    const user = this.configService.get<string>('EMAIL_USER');

    if (!host || !port || !user) {
      throw new Error('Email configuration is missing from environment variables.');
    }

    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: this.configService.get<string>('EMAIL_SECURE') === 'true',
      auth: {
        user: user,
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      tls: {
        ciphers: 'SSLv3',
      },
    });
  }

  async sendVerificationEmail(to: string, name: string, verificationLink: string) {
    const mailOptions = {
      from: `"CredentialVault Platform" <${this.configService.get<string>('EMAIL_USER')}>`,
      to,
      subject: 'Verifikasi Email untuk Pendaftaran Institusi Anda',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Selamat Datang di CredentialVault, ${name}!</h2>
          <p>Terima kasih telah mendaftar. Hanya satu langkah lagi untuk mengaktifkan akun institusi Anda. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:</p>
          <a href="${verificationLink}" style="background-color: #00ADB5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verifikasi Email Saya</a>
          <p>Jika tombol di atas tidak berfungsi, silakan salin dan tempel tautan berikut di browser Anda:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>Tautan ini akan kedaluwarsa dalam 24 jam. Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
          <hr>
          <p style="font-size: 0.8em; color: #777;">Hormat kami,<br>Tim CredentialVault</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email verifikasi berhasil dikirim ke ${to}. Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Gagal mengirim email verifikasi ke ${to}`, error);
      throw new Error('Gagal mengirim email verifikasi.');
    }
  }

  /**
   * BARU: Mengirim email notifikasi persetujuan ke institusi.
   * @param to Alamat email institusi yang disetujui.
   * @param name Nama institusi.
   */
  async sendApprovalEmail(to: string, name: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const loginLink = `${frontendUrl}/issuer/login`;

    const mailOptions = {
      from: `"CredentialVault Platform" <${this.configService.get<string>('EMAIL_USER')}>`,
      to,
      subject: 'Selamat! Pendaftaran Institusi Anda di CredentialVault Telah Disetujui',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Akun Institusi Anda Telah Diaktifkan!</h2>
          <p>Selamat, <strong>${name}</strong>! Pendaftaran Anda telah kami tinjau dan setujui.</p>
          <p>Anda sekarang dapat masuk ke dasbor penerbit untuk mulai membuat template dan menerbitkan kredensial digital. Anda telah diberikan <strong>2 kredit penerbitan gratis</strong> untuk memulai.</p>
          <a href="${loginLink}" style="background-color: #00ADB5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Masuk ke Dasbor</a>
          <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim support kami.</p>
          <hr>
          <p style="font-size: 0.8em; color: #777;">Hormat kami,<br>Tim CredentialVault</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email persetujuan berhasil dikirim ke ${to}.`);
    } catch (error) {
      this.logger.error(`Gagal mengirim email persetujuan ke ${to}`, error);
      // Gagal mengirim email tidak seharusnya menghentikan proses approval, jadi kita hanya log error.
    }
  }
}