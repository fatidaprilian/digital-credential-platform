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
import { InstitutionStatus, User, UserType } from '@prisma/client';
import { EmailService } from '../email/email.service'; // Impor EmailService

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private emailService: EmailService, // Inject EmailService
  ) {
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
    if (!file) {
      throw new BadRequestException('Verification document is required.');
    }

    const existingInstitution = await this.prisma.institution.findUnique({
      where: { officialEmail: dto.officialEmail },
    });
    if (existingInstitution) {
      throw new ConflictException('Email institusi sudah terdaftar.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.officialEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email user sudah terdaftar.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationDocumentUrl = file.path;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const institution = await tx.institution.create({
          data: {
            name: dto.name,
            officialEmail: dto.officialEmail,
            phoneNumber: dto.phoneNumber,
            address: dto.address,
            status: InstitutionStatus.PENDING_EMAIL_VERIFICATION,
            emailVerificationToken,
            verificationDocumentUrl,
          },
        });

        const adminUser = await tx.user.create({
          data: {
            email: dto.officialEmail,
            passwordHash,
            userType: UserType.issuer_admin,
            institutionId: institution.id,
          },
        });

        return { institution, adminUser };
      });

      const verificationLink = `${this.config.get(
        'APP_URL',
        'http://localhost:3000', // Default URL untuk development
      )}/auth/verify-email?token=${emailVerificationToken}`;

      // Mengirim email verifikasi menggunakan EmailService
      await this.emailService.sendVerificationEmail(dto.officialEmail, dto.name, verificationLink);

      return {
        message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.',
        institutionId: result.institution.id,
      };
    } catch (error) {
      console.error('Registration error:', error);
      if (error.message === 'Gagal mengirim email verifikasi.') {
        throw new InternalServerErrorException('Akun berhasil dibuat, namun gagal mengirim email verifikasi. Hubungi support.');
      }
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
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            status: true,
            issuanceCredits: true,
            subscriptionExpiresAt: true,
          },
        },
      },
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
      return this.signToken(user.id, user.email, user.userType, user.institutionId);
    }

    if (user.userType === UserType.issuer_admin) {
      if (!user.institution) {
        throw new UnauthorizedException(
          'Akun Anda tidak terhubung dengan institusi. Hubungi support.',
        );
      }

      const institutionStatus = user.institution.status;
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
      return this.signToken(user.id, user.email, user.userType, user.institutionId);
    }

    throw new UnauthorizedException('Tipe user tidak valid.');
  }

  async getProfile(user: User) {
    const userProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            status: true,
            issuanceCredits: true,
            subscriptionExpiresAt: true,
            officialEmail: true,
            phoneNumber: true,
            address: true,
          },
        },
      },
    });

    if (!userProfile) {
      throw new UnauthorizedException('Profil pengguna tidak ditemukan.');
    }
    
    if (userProfile.userType === UserType.issuer_admin && !userProfile.institution) {
      throw new UnauthorizedException(
        'Akun admin institusi tidak terhubung dengan institusi. Hubungi support.',
      );
    }
    
    const { passwordHash, ...profile } = userProfile;
    
    return profile;
  }

  async fixExistingUserInstitutionRelation(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { institution: true },
      });

      const institution = await this.prisma.institution.findUnique({
        where: { officialEmail: email },
      });

      if (!user) {
        throw new NotFoundException('User tidak ditemukan.');
      }

      if (!institution) {
        throw new NotFoundException('Institusi tidak ditemukan.');
      }

      if (!user.institutionId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { institutionId: institution.id },
        });

        console.log(`Fixed user-institution relation for ${email}: User ${user.id} -> Institution ${institution.id}`);
        return { message: 'Relasi user-institusi berhasil diperbaiki.' };
      }

      return { message: 'Relasi sudah benar.' };
    } catch (error) {
      console.error('Fix relation error:', error);
      throw new InternalServerErrorException('Gagal memperbaiki relasi user-institusi.');
    }
  }

  private async signToken(
    userId: number,
    email: string,
    userType: UserType,
    institutionId: number | null,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
      userType,
      institutionId,
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