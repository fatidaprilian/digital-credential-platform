import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class InstitutionRegisterDto {
  /**
   * Nama resmi institusi.
   * @example "Universitas Gadjah Mada"
   */
  @IsString()
  @IsNotEmpty({ message: 'Nama institusi tidak boleh kosong.' })
  name: string;

  /**
   * Alamat email resmi institusi yang akan digunakan untuk login dan komunikasi.
   * @example "admin@ugm.ac.id"
   */
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong.' })
  officialEmail: string;

  /**
   * Password untuk akun admin institusi.
   * Akan di-hash sebelum disimpan.
   */
  @IsString()
  @MinLength(8, { message: 'Password harus memiliki minimal 8 karakter.' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong.' })
  password: string;

  /**
   * Nomor telepon institusi (opsional).
   * @example "0274-588688"
   */
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  /**
   * Alamat fisik institusi (opsional).
   * @example "Bulaksumur, Caturtunggal, Sleman, Yogyakarta"
   */
  @IsString()
  @IsOptional()
  address?: string;
}