import { IsNotEmpty, IsString, IsInt, IsObject } from 'class-validator';

export class IssueCredentialDto {
  @IsInt()
  @IsNotEmpty()
  templateId: number;

  @IsString()
  @IsNotEmpty()
  recipientAddress: string;

  // Mendefinisikan bahwa dynamicData adalah sebuah objek
  @IsObject()
  @IsNotEmpty()
  dynamicData: Record<string, string>;
}