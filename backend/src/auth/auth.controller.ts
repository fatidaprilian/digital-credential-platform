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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { InstitutionRegisterDto } from './dto/institution-register.dto';
import { AuthDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

// Custom file type validator
class CustomFileTypeValidator extends FileValidator {
  private allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];

  isValid(file: Express.Multer.File): boolean {
    return this.allowedMimeTypes.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint untuk Institusi mendaftarkan akun baru.
   * Menerima data JSON dan satu file upload untuk dokumen verifikasi.
   * @param file Dokumen verifikasi (PDF, JPG, PNG, maks 5MB)
   * @param dto Data pendaftaran institusi (nama, email, password, dll)
   */
  @Post('register/institution')
  @UseInterceptors(
    FileInterceptor('verificationDocument', {
      storage: diskStorage({
        destination: './uploads/verification-documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
        },
      }),
    })
  )
  registerInstitution(
    @UploadedFile(
      // --- PIPA VALIDASI FILE ---
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new CustomFileTypeValidator({}),
        ],
        fileIsRequired: true, // Dokumen wajib di-upload
      }),
    )
    file: Express.Multer.File,
    @Body() dto: InstitutionRegisterDto,
  ) {
    return this.authService.registerInstitution(dto, file);
  }

  /**
   * Endpoint yang akan diakses dari link di email verifikasi.
   * @param token Token yang dikirim ke email
   */
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Endpoint untuk login.
   * Service akan mengecek status akun sebelum memberikan token.
   * @param dto Berisi email dan password
   */
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }

  /**
   * Endpoint untuk mendapatkan profil user yang sedang login.
   * Hanya bisa diakses dengan token JWT yang valid.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req: Request) {
    // req.user akan berisi payload dari JWT setelah divalidasi oleh passport
    return req.user;
  }
}