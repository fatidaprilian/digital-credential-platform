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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guard/admin.guard';
import { AdminService } from './admin.service';
import { RejectInstitutionDto } from './dto/reject-institution.dto';

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