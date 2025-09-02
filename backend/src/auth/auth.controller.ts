// Path: backend/src/auth/auth.controller.ts

import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileValidator,
  UseGuards,
  Req,
  Res, // <-- 1. Impor 'Res'
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { InstitutionRegisterDto } from './dto/institution-register.dto';
import { AuthDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express'; // <-- 2. Impor 'Response'
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config'; // <-- 3. Impor 'ConfigService'

// Custom file type validator (tetap sama)
class CustomFileTypeValidator extends FileValidator {
  private allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  isValid(file: Express.Multer.File): boolean {
    return this.allowedMimeTypes.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(
      ', ',
    )}`;
  }
}

@Controller('auth')
export class AuthController {
  // --- 4. Inject ConfigService di Constructor ---
  constructor(
    private authService: AuthService,
    private configService: ConfigService, 
  ) {}

  @Post('register/institution')
  @UseInterceptors(
    FileInterceptor('verificationDocument', {
      storage: diskStorage({
        destination: './uploads/verification-documents',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
        },
      }),
    }),
  )
  registerInstitution(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new CustomFileTypeValidator({}),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: InstitutionRegisterDto,
  ) {
    return this.authService.registerInstitution(dto, file);
  }

  /**
   * --- PERUBAHAN UTAMA DI SINI ---
   * Endpoint ini sekarang akan melakukan redirect ke frontend.
   */
  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Res() response: Response, // Dapatkan akses ke objek response
  ) {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000', // Fallback untuk development
    );
    try {
      await this.authService.verifyEmail(token);
      // Jika berhasil, arahkan ke halaman sukses di frontend
      return response.redirect(`${frontendUrl}/auth/verification-success`);
    } catch (error) {
      // Jika gagal, arahkan kembali ke halaman registrasi dengan pesan error
      return response.redirect(
        `${frontendUrl}/issuer/register?error=verification_failed`,
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req: Request) {
    return this.authService.getProfile(req.user as User);
  }
}