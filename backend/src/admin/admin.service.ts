// Path: backend/src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstitutionStatus, Prisma } from '@prisma/client';
import { RejectInstitutionDto } from './dto/reject-institution.dto';
import { EmailService } from '../email/email.service'; // <-- 1. Impor EmailService

@Injectable()
export class AdminService {
  // --- 2. Inject EmailService di constructor ---
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Mengambil statistik kunci untuk dasbor admin.
   */
  async getSystemStats() {
    const totalInstitutions = await this.prisma.institution.count({
      where: { status: { in: ['ACTIVE', 'SUSPENDED'] } },
    });
    const pendingInstitutions = await this.prisma.institution.count({
      where: { status: 'PENDING_ADMIN_VERIFICATION' },
    });
    const totalUsers = await this.prisma.user.count();
    const credentialsIssued = await this.prisma.issuanceLog.count();

    return {
      totalInstitutions,
      pendingInstitutions,
      totalUsers,
      credentialsIssued,
    };
  }

  /**
   * Mengambil institusi yang sudah terdaftar.
   */
  async getManagedInstitutions(search?: string) {
    const where: Prisma.InstitutionWhereInput = {
      status: {
        in: [InstitutionStatus.ACTIVE, InstitutionStatus.SUSPENDED],
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { officialEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.institution.findMany({
      where,
      select: {
        id: true,
        name: true,
        officialEmail: true,
        status: true,
        issuanceCredits: true,
        adminUser: { select: { email: true, createdAt: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Mengambil semua institusi yang statusnya PENDING_ADMIN_VERIFICATION.
   */
  async getPendingInstitutions() {
    return this.prisma.institution.findMany({
      where: { status: InstitutionStatus.PENDING_ADMIN_VERIFICATION },
      select: {
        id: true,
        name: true,
        officialEmail: true,
        status: true,
        issuanceCredits: true,
        adminUser: { select: { email: true, createdAt: true } },
      },
      orderBy: { adminUser: { createdAt: 'asc' } },
    });
  }

  /**
   * Menyetujui pendaftaran institusi dan mengirim email notifikasi.
   */
  async approveInstitution(id: number) {
    // Ambil data institusi terlebih dahulu untuk mendapatkan email dan nama
    const institutionToApprove = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institutionToApprove) {
      throw new NotFoundException(`Institusi dengan ID ${id} tidak ditemukan.`);
    }

    // Update status institusi di database
    const updatedInstitution = await this.prisma.institution.update({
      where: { id },
      data: {
        status: InstitutionStatus.ACTIVE,
        verifiedAt: new Date(),
        rejectionReason: null,
        issuanceCredits: 2, // Memberikan kredit awal
      },
    });

    // --- 3. Panggil metode pengiriman email SETELAH berhasil update ---
    await this.emailService.sendApprovalEmail(
      updatedInstitution.officialEmail,
      updatedInstitution.name,
    );

    return updatedInstitution;
  }

  /**
   * Menolak pendaftaran institusi.
   */
  async rejectInstitution(id: number, dto: RejectInstitutionDto) {
    await this.prisma.institution.findUniqueOrThrow({ where: { id } });
    // TODO: Di masa depan, Anda bisa menambahkan notifikasi email penolakan di sini
    return this.prisma.institution.update({
      where: { id },
      data: {
        status: InstitutionStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
      },
    });
  }

  /**
   * Menonaktifkan (suspend) sebuah institusi.
   */
  async suspendInstitution(id: number) {
    await this.prisma.institution.findUniqueOrThrow({ where: { id } });
    return this.prisma.institution.update({
      where: { id },
      data: { status: InstitutionStatus.SUSPENDED },
    });
  }

  /**
   * Mengaktifkan kembali institusi yang di-suspend.
   */
  async activateInstitution(id: number) {
    await this.prisma.institution.findUniqueOrThrow({ where: { id } });
    return this.prisma.institution.update({
      where: { id },
      data: { status: InstitutionStatus.ACTIVE },
    });
  }
}