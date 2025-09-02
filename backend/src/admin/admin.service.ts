// Path: backend/src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstitutionStatus, Prisma } from '@prisma/client';
import { RejectInstitutionDto } from './dto/reject-institution.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
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
        verificationDocumentUrl: true, // <-- Ditambahkan untuk konsistensi
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
        verificationDocumentUrl: true, // <-- REVISI: Tambahkan field ini
        adminUser: { select: { email: true, createdAt: true } },
      },
      orderBy: { adminUser: { createdAt: 'asc' } },
    });
  }

  /**
   * REVISI: Metode baru untuk mendapatkan path dokumen verifikasi.
   * @param id ID Institusi
   * @returns path file dari dokumen
   */
  async getVerificationDocumentPath(id: number): Promise<string> {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      select: { verificationDocumentUrl: true },
    });

    if (!institution || !institution.verificationDocumentUrl) {
      throw new NotFoundException(
        `Dokumen verifikasi untuk institusi dengan ID ${id} tidak ditemukan.`,
      );
    }
    return institution.verificationDocumentUrl;
  }

  /**
   * Menyetujui pendaftaran institusi dan mengirim email notifikasi.
   */
  async approveInstitution(id: number) {
    const institutionToApprove = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institutionToApprove) {
      throw new NotFoundException(`Institusi dengan ID ${id} tidak ditemukan.`);
    }

    const updatedInstitution = await this.prisma.institution.update({
      where: { id },
      data: {
        status: InstitutionStatus.ACTIVE,
        verifiedAt: new Date(),
        rejectionReason: null,
        issuanceCredits: 2, // Memberikan kredit awal
      },
    });

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