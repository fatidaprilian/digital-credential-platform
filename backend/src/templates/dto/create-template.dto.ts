// backend/src/templates/dto/create-template.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Ubah tipe data yang diharapkan menjadi string
  @IsString()
  @IsOptional()
  dynamicFields?: string; // <-- Ubah dari 'object' menjadi 'string'
}
