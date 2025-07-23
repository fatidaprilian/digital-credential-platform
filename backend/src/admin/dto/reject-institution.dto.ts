// Path: backend/src/admin/dto/reject-institution.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectInstitutionDto {
  @IsString()
  @IsNotEmpty({ message: 'Alasan penolakan tidak boleh kosong.' })
  rejectionReason: string;
}
