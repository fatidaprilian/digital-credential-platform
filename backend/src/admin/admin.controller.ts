// Path: backend/src/admin/admin.controller.ts
import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guard/admin.guard';
import { AdminService } from './admin.service';
import { RejectInstitutionDto } from './dto/reject-institution.dto';

// Lindungi semua endpoint di controller ini dengan AuthGuard (cek JWT) dan AdminGuard (cek tipe user)
@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('institutions/pending')
  getPendingInstitutions() {
    return this.adminService.getPendingInstitutions();
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
}
