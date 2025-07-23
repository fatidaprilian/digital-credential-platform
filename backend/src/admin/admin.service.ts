// Path: backend/src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstitutionStatus } from '@prisma/client';
import { RejectInstitutionDto } from './dto/reject-institution.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Mengambil semua institusi yang statusnya PENDING_ADMIN_VERIFICATION.
   */
  async getPendingInstitutions() {
    return this.prisma.institution.findMany({
      where: { status: InstitutionStatus.PENDING_ADMIN_VERIFICATION },
      orderBy: {
        // Mengambil data user yang terhubung untuk mendapatkan tanggal pendaftaran
        adminUser: {
          createdAt: 'asc',
        },
      },
    });
  }

  /**
   * Menyetujui pendaftaran institusi.
   * @param id ID institusi yang akan disetujui
   */
  async approveInstitution(id: number) {
    // Pastikan institusi ada sebelum update
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) {
      throw new NotFoundException(`Institusi dengan ID ${id} tidak ditemukan.`);
    }

    return this.prisma.institution.update({
      where: { id },
      data: {
        status: InstitutionStatus.ACTIVE,
        verifiedAt: new Date(),
        rejectionReason: null,
        // Berikan kredit awal untuk penerbitan saat disetujui
        issuanceCredits: 10,
      },
    });
  }

  /**
   * Menolak pendaftaran institusi.
   * @param id ID institusi yang akan ditolak
   * @param dto DTO yang berisi alasan penolakan
   */
  async rejectInstitution(id: number, dto: RejectInstitutionDto) {
    // Pastikan institusi ada sebelum update
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) {
      throw new NotFoundException(`Institusi dengan ID ${id} tidak ditemukan.`);
    }
    
    return this.prisma.institution.update({
      where: { id },
      data: {
        status: InstitutionStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
      },
    });
  }
}
