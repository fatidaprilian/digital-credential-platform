import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TemplateBuilderController } from './template-builder.controller';
import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';

@Module({
  controllers: [TemplatesController, TemplateBuilderController],
  providers: [TemplatesService, PrismaService, IpfsService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
