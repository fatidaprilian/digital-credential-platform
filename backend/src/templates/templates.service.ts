import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { IpfsService } from '../ipfs/ipfs.service';

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private ipfsService: IpfsService,
  ) {}

  /**
   * Helper untuk mendapatkan institusi yang terhubung dengan user admin.
   * Ini memastikan user yang sedang login benar-benar admin dari sebuah institusi.
   */
  private async getInstitutionFromAdmin(user: User) {
    // Di skema baru, User memiliki 'institutionId'. Kita bisa gunakan itu.
    if (!user.institutionId) {
      throw new UnauthorizedException(
        'User ini tidak terhubung dengan institusi manapun.',
      );
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: user.institutionId },
    });

    if (!institution) {
      throw new NotFoundException(
        `Institusi dengan ID ${user.institutionId} tidak ditemukan.`,
      );
    }
    return institution;
  }

  async create(
    createTemplateDto: CreateTemplateDto,
    user: User,
    file: Express.Multer.File,
  ) {
    // Gunakan helper untuk mendapatkan institusi
    const institution = await this.getInstitutionFromAdmin(user);

    // Upload file template ke IPFS
    const { ipfsHash } = await this.ipfsService.uploadFile(file);

    // Parse string JSON dari DTO menjadi objek JSON sebelum disimpan
    const dynamicFieldsObject = createTemplateDto.dynamicFields
      ? JSON.parse(createTemplateDto.dynamicFields)
      : {};

    const newTemplate = await this.prisma.credentialTemplate.create({
      data: {
        name: createTemplateDto.name,
        description: createTemplateDto.description,
        institutionId: institution.id, // Gunakan ID institusi yang ditemukan
        ipfsTemplateHash: ipfsHash,
        dynamicFields: dynamicFieldsObject,
      },
    });

    return newTemplate;
  }

  async findAllForInstitution(user: User) {
    // Gunakan helper untuk mendapatkan institusi
    const institution = await this.getInstitutionFromAdmin(user);

    // Cari semua template yang dimiliki oleh institusi tersebut
    return this.prisma.credentialTemplate.findMany({
      where: { institutionId: institution.id },
    });
  }
}
