import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateDragDropTemplateDto } from './dto/create-drag-drop-template.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { IpfsService } from '../ipfs/ipfs.service';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private prisma: PrismaService,
    private ipfsService: IpfsService,
  ) {}

  private async getInstitutionFromAdmin(user: User) {
    this.logger.debug(`Checking institution for user: ${user.email}`);

    if (!user.institutionId) {
      this.logger.error(`User ${user.email} has no institutionId`);
      throw new UnauthorizedException(
        'User account is not associated with any institution.',
      );
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: user.institutionId },
    });

    if (!institution) {
      this.logger.error(`Institution with ID ${user.institutionId} not found`);
      throw new NotFoundException(
        `Institution with ID ${user.institutionId} not found.`,
      );
    }

    this.logger.debug(
      `Found institution: ${institution.name} (ID: ${institution.id})`,
    );
    return institution;
  }

  /**
   * Helper method to ensure coordinates and dimensions are integers
   */
  private roundCoordinates(component: any) {
    return {
      ...component,
      x: Math.round(Number(component.x) || 0),
      y: Math.round(Number(component.y) || 0),
      width: Math.round(Number(component.width) || 0),
      height: Math.round(Number(component.height) || 0),
      style: component.style
        ? {
            ...component.style,
            fontSize: component.style.fontSize
              ? Math.round(Number(component.style.fontSize))
              : component.style.fontSize,
            borderWidth: component.style.borderWidth
              ? Math.round(Number(component.style.borderWidth))
              : component.style.borderWidth,
            borderRadius: component.style.borderRadius
              ? Math.round(Number(component.style.borderRadius))
              : component.style.borderRadius,
          }
        : component.style,
    };
  }

  /**
   * Helper method to round dynamic field coordinates
   */
  private roundDynamicFieldCoordinates(field: any) {
    return {
      ...field,
      x: Math.round(Number(field.x) || 0),
      y: Math.round(Number(field.y) || 0),
      width: field.width ? Math.round(Number(field.width)) : field.width,
      height: field.height ? Math.round(Number(field.height)) : field.height,
    };
  }

  // Fungsi create yang lama, tidak diubah
  async create(
    createTemplateDto: CreateTemplateDto,
    user: User,
    file: Express.Multer.File,
  ) {
    const institution = await this.getInstitutionFromAdmin(user);
    const { ipfsHash } = await this.ipfsService.uploadFile(file);

    const dynamicFieldsObject = createTemplateDto.dynamicFields
      ? JSON.parse(createTemplateDto.dynamicFields)
      : {};

    const newTemplate = await this.prisma.credentialTemplate.create({
      data: {
        name: createTemplateDto.name,
        description: createTemplateDto.description,
        institutionId: institution.id,
        ipfsTemplateHash: ipfsHash,
        dynamicFields: dynamicFieldsObject,
      },
    });

    return newTemplate;
  }

  // === REVISI DI FUNGSI INI ===
  async createDragDropTemplate(
    createTemplateDto: CreateDragDropTemplateDto,
    user: User,
  ) {
    try {
      this.logger.log('Starting template creation process');
      // ... (validasi dan pemrosesan komponen tetap sama) ...
      const institution = await this.getInstitutionFromAdmin(user);

      if (!createTemplateDto.name || !createTemplateDto.name.trim()) {
        throw new BadRequestException('Template name is required');
      }

      if (
        !createTemplateDto.components ||
        createTemplateDto.components.length === 0
      ) {
        throw new BadRequestException(
          'Template must have at least one component',
        );
      }

      const processedComponents = createTemplateDto.components.map(
        (component) => this.roundCoordinates(component),
      );

      const processedDynamicFields = (
        createTemplateDto.dynamicFields || []
      ).map((field) => this.roundDynamicFieldCoordinates(field));

      // --- REVISI: Persiapkan Data untuk IPFS dengan dimensi kanvas ---
      const templateData = {
        name: createTemplateDto.name.trim(),
        description: createTemplateDto.description?.trim() || '',
        backgroundImage: createTemplateDto.backgroundImage || '',
        components: processedComponents,
        dynamicFields: processedDynamicFields,
        // Sertakan dimensi kanvas dari DTO
        canvasWidth: createTemplateDto.canvasWidth,
        canvasHeight: createTemplateDto.canvasHeight,
        createdAt: new Date().toISOString(),
        version: '1.0',
      };

      this.logger.log('Uploading template to IPFS...');
      this.logger.debug(
        `Template data to be uploaded: ${JSON.stringify(templateData, null, 2)}`,
      );

      const templateBuffer = Buffer.from(JSON.stringify(templateData)); // Hapus null, 2 agar lebih kecil
      const mockFile = {
        buffer: templateBuffer,
        originalname: `template_${Date.now()}.json`,
        mimetype: 'application/json',
        size: templateBuffer.length,
      } as Express.Multer.File;

      const { ipfsHash } = await this.ipfsService.uploadFile(mockFile);
      this.logger.log(`Template uploaded to IPFS with hash: ${ipfsHash}`);

      // --- Simpan ke Database (tidak ada perubahan) ---
      this.logger.log('Saving template to database...');
      const newTemplate = await this.prisma.credentialTemplate.create({
        data: {
          name: templateData.name,
          description: templateData.description,
          institutionId: institution.id,
          ipfsTemplateHash: ipfsHash,
          dynamicFields: processedDynamicFields as any,
        },
      });

      this.logger.log(`Template saved to database with ID: ${newTemplate.id}`);
      return newTemplate;
    } catch (error) {
      this.logger.error('Error in createDragDropTemplate:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      if (error instanceof HttpException) throw error;

      if (error.code === 'P2002') {
        throw new BadRequestException(
          'A template with this name already exists.',
        );
      }

      throw new BadRequestException(
        `Failed to create template: ${error.message}`,
      );
    }
  }

  async uploadBackground(file: Express.Multer.File, user: User) {
    await this.getInstitutionFromAdmin(user); // Auth check
    try {
      this.logger.log(`Uploading background file: ${file.originalname}`);
      const { ipfsHash } = await this.ipfsService.uploadFile(file);
      const url = `${process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs'}/${ipfsHash}`;
      this.logger.log('Background uploaded successfully:', { ipfsHash, url });
      return { success: true, ipfsHash, url };
    } catch (error) {
      this.logger.error('Error uploading background:', error);
      throw new BadRequestException(
        `Failed to upload background image: ${error.message}`,
      );
    }
  }

  async getDragDropTemplate(templateId: number, user: User) {
    const institution = await this.getInstitutionFromAdmin(user);
    const template = await this.prisma.credentialTemplate.findFirst({
      where: { id: templateId, institutionId: institution.id },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  // === REVISI DI FUNGSI INI JUGA ===
  async updateDragDropTemplate(
    templateId: number,
    updateData: CreateDragDropTemplateDto,
    user: User,
  ) {
    const institution = await this.getInstitutionFromAdmin(user);
    const existingTemplate = await this.prisma.credentialTemplate.findFirst({
      where: { id: templateId, institutionId: institution.id },
    });
    if (!existingTemplate) throw new NotFoundException('Template not found');

    const processedComponents = (updateData.components || []).map((component) =>
      this.roundCoordinates(component),
    );

    const processedDynamicFields = (updateData.dynamicFields || []).map(
      (field) => this.roundDynamicFieldCoordinates(field),
    );

    // --- REVISI: Persiapkan data untuk IPFS dengan dimensi kanvas ---
    const templateData = {
      name: updateData.name,
      description: updateData.description || '',
      backgroundImage: updateData.backgroundImage || '',
      components: processedComponents,
      dynamicFields: processedDynamicFields,
      // Sertakan dimensi kanvas dari DTO
      canvasWidth: updateData.canvasWidth,
      canvasHeight: updateData.canvasHeight,
      updatedAt: new Date().toISOString(),
      version: '1.1', // Example version bump
    };

    const templateBuffer = Buffer.from(JSON.stringify(templateData));
    const mockFile = {
      buffer: templateBuffer,
      originalname: `template_update_${Date.now()}.json`,
      mimetype: 'application/json',
      size: templateBuffer.length,
    } as Express.Multer.File;

    const { ipfsHash } = await this.ipfsService.uploadFile(mockFile);

    const updatedTemplate = await this.prisma.credentialTemplate.update({
      where: { id: templateId },
      data: {
        name: updateData.name,
        description: updateData.description || '',
        ipfsTemplateHash: ipfsHash,
        dynamicFields: processedDynamicFields as any,
      },
    });
    return updatedTemplate;
  }

  async deleteTemplate(templateId: number, user: User) {
    const institution = await this.getInstitutionFromAdmin(user);
    const template = await this.prisma.credentialTemplate.findFirst({
      where: { id: templateId, institutionId: institution.id },
    });

    if (!template) {
      throw new NotFoundException(
        `Template with ID ${templateId} not found or you don't have permission to delete it.`,
      );
    }

    await this.prisma.credentialTemplate.delete({
      where: { id: templateId },
    });

    this.logger.log(
      `Template ID ${templateId} deleted successfully by user ${user.email}`,
    );
    return { success: true, message: 'Template deleted successfully' };
  }

  async generateTemplatePreview(templateId: number, user: User) {
    const template = await this.getDragDropTemplate(templateId, user);
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      previewUrl: template.ipfsTemplateHash
        ? `${process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs'}/${template.ipfsTemplateHash}`
        : null,
    };
  }

  async findAllForInstitution(user: User) {
    const institution = await this.getInstitutionFromAdmin(user);
    return this.prisma.credentialTemplate.findMany({
      where: { institutionId: institution.id },
      orderBy: { id: 'desc' },
    });
  }
}
