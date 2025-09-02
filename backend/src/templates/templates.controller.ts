import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // Menerima file dari field bernama 'file'
  create(
    @Body() createTemplateDto: CreateTemplateDto,
    @Req() req: Request,
    @UploadedFile(
      // Validasi file (opsional tapi direkomendasikan)
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })], // Limit 5MB
      }),
    )
    file: Express.Multer.File,
  ) {
    const user = req.user as User;
    return this.templatesService.create(createTemplateDto, user, file);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.templatesService.findAllForInstitution(user);
  }
}
