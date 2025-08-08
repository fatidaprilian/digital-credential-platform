import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplatesService } from './templates.service';
import { CreateDragDropTemplateDto } from './dto/create-drag-drop-template.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('template-builder')
export class TemplateBuilderController {
  private readonly logger = new Logger(TemplateBuilderController.name);

  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  async createDragDropTemplate(
    @Body() createTemplateDto: CreateDragDropTemplateDto,
    @Req() req: Request,
  ) {
    try {
      this.logger.log('Received template creation request');
      this.logger.debug(
        'Template data:',
        JSON.stringify(createTemplateDto, null, 2),
      );

      const user = req.user as User;
      this.logger.log(`User creating template: ${user.email} (ID: ${user.id})`);

      // Validate user has institution
      if (!user.institutionId) {
        this.logger.error(`User ${user.email} has no institution ID`);
        throw new HttpException(
          'User must be associated with an institution to create templates',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.templatesService.createDragDropTemplate(
        createTemplateDto,
        user,
      );

      this.logger.log(`Template created successfully with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error('Error creating template:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      throw new HttpException(
        {
          message: 'Failed to create template',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload-background')
  @UseInterceptors(FileInterceptor('background'))
  async uploadBackground(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          new FileTypeValidator({
            fileType: /^image\/(jpeg|jpg|png|gif|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as User;
      return await this.templatesService.uploadBackground(file, user);
    } catch (error) {
      this.logger.error('Error uploading background:', error);
      throw new HttpException(
        error.message || 'Failed to upload background',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async getTemplate(@Param('id') id: string, @Req() req: Request) {
    try {
      const user = req.user as User;
      return await this.templatesService.getDragDropTemplate(
        parseInt(id, 10),
        user,
      );
    } catch (error) {
      this.logger.error('Error getting template:', error);
      throw new HttpException(
        error.message || 'Template not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateData: CreateDragDropTemplateDto,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as User;
      return await this.templatesService.updateDragDropTemplate(
        parseInt(id, 10),
        updateData,
        user,
      );
    } catch (error) {
      this.logger.error('Error updating template:', error);
      throw new HttpException(
        error.message || 'Failed to update template',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string, @Req() req: Request) {
    try {
      const user = req.user as User;
      this.logger.log(
        `Received request to delete template ID: ${id} by user ${user.email}`,
      );
      return await this.templatesService.deleteTemplate(parseInt(id, 10), user);
    } catch (error) {
      this.logger.error(`Error deleting template ID ${id}:`, error);
      throw new HttpException(
        error.message || 'Failed to delete template',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/preview')
  async previewTemplate(@Param('id') id: string, @Req() req: Request) {
    try {
      const user = req.user as User;
      return await this.templatesService.generateTemplatePreview(
        parseInt(id, 10),
        user,
      );
    } catch (error) {
      this.logger.error('Error generating preview:', error);
      throw new HttpException(
        error.message || 'Failed to generate preview',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
