// Path: backend/src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InstitutionRegisterDto } from './dto/institution-register.dto';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { InstitutionStatus, UserType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    // Ensure uploads directory exists
    this.ensureUploadsDirectory();
  }

  private ensureUploadsDirectory() {
    const uploadsDir = './uploads/verification-documents';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory:', uploadsDir);
    }
  }

  async registerInstitution(
    dto: InstitutionRegisterDto,
    file: Express.Multer.File,
  ) {
    // --- TAMBAHKAN BARIS INI UNTUK DEBUGGING ---
    console.log('--- DEBUG: File object received in service ---');
    console.log(file);
    // ---------------------------------------------

    const existingInstitution = await this.prisma.institution.findUnique({
      where: { officialEmail: dto.officialEmail },
    });
    if (existingInstitution) {
      throw new ConflictException('Email institusi sudah terdaftar.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    // Ambil path file dari objek file yang diunggah
    const verificationDocumentUrl = file.path;

    try {
      const institution = await this.prisma.institution.create({
        data: {
          name: dto.name,
          officialEmail: dto.officialEmail,
          phoneNumber: dto.phoneNumber,
          address: dto.address,
          status: InstitutionStatus.PENDING_EMAIL_VERIFICATION,
          emailVerificationToken,
          verificationDocumentUrl, // Simpan path ke database
          adminUser: {
            create: {
              email: dto.officialEmail,
              passwordHash,
              userType: UserType.issuer_admin,
            },
          },
        },
      });

      const verificationLink = `${this.config.get(
        'APP_URL',
      )}/auth/verify-email?token=${emailVerificationToken}`;
      console.log('--- UNTUK DEVELOPMENT ---');
      console.log('Link Verifikasi Email:', verificationLink);

      return {
        message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.',
        institutionId: institution.id,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Gagal membuat akun institusi.');
    }
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token verifikasi tidak disediakan.');
    }
    const institution = await this.prisma.institution.findUnique({
      where: { emailVerificationToken: token },
    });
    if (!institution) {
      throw new NotFoundException(
        'Token verifikasi tidak valid atau sudah kedaluwarsa.',
      );
    }
    await this.prisma.institution.update({
      where: { id: institution.id },
      data: {
        status: InstitutionStatus.PENDING_ADMIN_VERIFICATION,
        emailVerificationToken: null,
      },
    });
    return {
      message:
        'Verifikasi email berhasil! Akun Anda sedang dalam peninjauan oleh admin platform.',
    };
  }

  async signin(dto: AuthDto): Promise<{ access_token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { institution: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    if (user.userType === UserType.platform_admin) {
      console.log('Platform admin login successful.');
      return this.signToken(user.id, user.email, user.userType);
    }

    if (user.userType === UserType.issuer_admin) {
      const institutionStatus = user.institution?.status;
      if (institutionStatus !== InstitutionStatus.ACTIVE) {
        switch (institutionStatus) {
          case InstitutionStatus.PENDING_EMAIL_VERIFICATION:
            throw new UnauthorizedException(
              'Akun belum aktif. Silakan verifikasi email Anda.',
            );
          case InstitutionStatus.PENDING_ADMIN_VERIFICATION:
            throw new UnauthorizedException(
              'Akun sedang dalam proses peninjauan oleh admin.',
            );
          case InstitutionStatus.REJECTED:
            throw new UnauthorizedException(
              'Pendaftaran akun Anda telah ditolak.',
            );
          case InstitutionStatus.SUSPENDED:
            throw new UnauthorizedException('Akun Anda sedang ditangguhkan.');
          default:
            throw new UnauthorizedException(
              'Akun institusi tidak dapat diakses. Hubungi support.',
            );
        }
      }
      return this.signToken(user.id, user.email, user.userType);
    }

    throw new UnauthorizedException('Tipe user tidak valid.');
  }

  private async signToken(
    userId: number,
    email: string,
    userType: UserType,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
      userType,
    };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '24h',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}