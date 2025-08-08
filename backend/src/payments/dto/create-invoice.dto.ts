import { IsNotEmpty, IsString, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['credits', 'subscription'])
  itemType: 'credits' | 'subscription';

  @IsInt()
  @Min(1)
  @IsOptional() // Hanya wajib jika itemType adalah 'credits'
  quantity?: number; // Jumlah kredit yang dibeli
}