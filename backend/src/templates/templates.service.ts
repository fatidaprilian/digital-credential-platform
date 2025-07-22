import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(
    createTemplateDto: CreateTemplateDto,
    user: User,
    file: Express.Multer.File,
  ) {
    const institution = await this.prisma.institution.findFirst({
      where: { adminUserId: user.id },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found for this admin');
    }

    const { ipfsHash } = await this.ipfsService.uploadFile(file);

    // Parse string JSON dari DTO menjadi objek JSON sebelum disimpan
    const dynamicFieldsObject = createTemplateDto.dynamicFields
      ? JSON.parse(createTemplateDto.dynamicFields)
      : {};

    const newTemplate = await this.prisma.credentialTemplate.create({
      data: {
        name: createTemplateDto.name,
        description: createTemplateDto.description,
        institutionId: institution.id,
        ipfsTemplateHash: ipfsHash,
        dynamicFields: dynamicFieldsObject, // Simpan objek yang sudah di-parse
      },
    });

    return newTemplate;
  }

  async findAllForInstitution(user: User) {
    const institution = await this.prisma.institution.findFirst({
      where: { adminUserId: user.id },
    });

    if (!institution) {
      return [];
    }

    return this.prisma.credentialTemplate.findMany({
      where: { institutionId: institution.id },
    });
  }
}
