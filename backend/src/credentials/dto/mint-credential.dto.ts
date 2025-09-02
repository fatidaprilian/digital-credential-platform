// backend/src/credentials/dto/mint-credential.dto.ts
import { IsEthereumAddress, IsString, IsNotEmpty } from 'class-validator';

export class MintCredentialDto {
  @IsEthereumAddress()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  tokenURI: string; // Ini akan berisi IPFS Hash dari metadata
}