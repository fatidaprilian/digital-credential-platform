// Path: backend/src/admin/admin.controller.ts
import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  ParseIntPipe,
  Body,
  Query,
  Res, // <-- REVISI: Impor decorator 'Res'
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guard/admin.guard';
import { AdminService } from './admin.service';
import { RejectInstitutionDto } from './dto/reject-institution.dto';
import { Response } from 'express'; // <-- REVISI: Impor 'Response' dari express
import { join } from 'path'; // <-- REVISI: Impor 'join' dari path

@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('institutions/manage')
  getManagedInstitutions(@Query('search') search?: string) {
    return this.adminService.getManagedInstitutions(search);
  }

  @Get('institutions/pending')
  getPendingInstitutions() {
    return this.adminService.getPendingInstitutions();
  }

  /**
   * REVISI: Endpoint baru untuk mengambil dan menyajikan file dokumen verifikasi.
   * @param id ID Institusi
   * @param res Objek Response dari Express untuk mengirim file
   */
  @Get('institutions/:id/document')
  async getVerificationDocument(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const filePath = await this.adminService.getVerificationDocumentPath(id);
    // Menggabungkan path relatif dari DB dengan direktori kerja saat ini untuk mendapatkan path absolut
    const absolutePath = join(process.cwd(), filePath);
    // Mengirimkan file fisik sebagai respons
    return res.sendFile(absolutePath);
  }

  @Patch('institutions/:id/approve')
  approveInstitution(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.approveInstitution(id);
  }

  @Patch('institutions/:id/reject')
  rejectInstitution(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectInstitutionDto,
  ) {
    return this.adminService.rejectInstitution(id, dto);
  }

  @Patch('institutions/:id/suspend')
  suspendInstitution(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.suspendInstitution(id);
  }

  @Patch('institutions/:id/activate')
  activateInstitution(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.activateInstitution(id);
  }
}