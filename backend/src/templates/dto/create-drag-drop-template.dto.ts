import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class StyleDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  fontSize?: number;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  fontWeight?: string;

  @IsOptional()
  @IsString()
  @IsIn(['left', 'center', 'right'])
  textAlign?: 'left' | 'center' | 'right';

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  borderWidth?: number;

  @IsOptional()
  @IsString()
  borderColor?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  borderRadius?: number;
}

class TemplateComponentDto {
  @IsString()
  id: string;

  @IsString()
  @IsIn([
    'static-text',
    'dynamic-field',
    'image-placeholder',
    'logo',
    'signature',
    'qr-code',
  ])
  type: string;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  x: number;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  y: number;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  width: number;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  height: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  fieldName?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => StyleDto)
  style?: StyleDto;
}

interface DynamicFieldInterface {
  [key: string]: any;
  name: string;
  label: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  placeholder?: string;
  isRequired?: boolean;
}

class DynamicFieldDto implements DynamicFieldInterface {
  @IsString()
  name: string;

  @IsString()
  label: string;

  @IsString()
  @IsIn(['dynamic-field', 'image-placeholder']) // PERBAIKAN: Pastikan hanya type yang valid
  type: string;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  x: number;

  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  y: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  width?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    typeof value === 'number' ? Math.round(value) : value,
  )
  height?: number;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  [key: string]: any;
}

export class CreateDragDropTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentDto)
  components: TemplateComponentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DynamicFieldDto)
  @IsOptional()
  dynamicFields?: DynamicFieldDto[];

  @IsNumber()
  @IsOptional()
  canvasWidth?: number;

  @IsNumber()
  @IsOptional()
  canvasHeight?: number;
}
