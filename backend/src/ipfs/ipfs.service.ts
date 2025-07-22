import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinataSDK } from 'pinata';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private pinata: PinataSDK;

  constructor(private configService: ConfigService) {
    const pinataJwt = this.configService.get<string>('PINATA_JWT');
    if (!pinataJwt) {
      throw new Error('Pinata JWT is not configured in .env file');
    }
    this.pinata = new PinataSDK({ pinataJwt });
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ ipfsHash: string; fileSize: number }> {
    this.logger.log(`Uploading file ${file.originalname} to IPFS via new SDK...`);

    // Konversi buffer dari Multer menjadi File object yang bisa dibaca SDK baru
    const fileToUpload = new File([file.buffer], file.originalname, {
      type: file.mimetype,
    });

    const result = await this.pinata.upload.public.file(fileToUpload);
    this.logger.log(`File uploaded successfully. Hash: ${result.cid}`);
    
    // Perhatikan nama properti berubah dari 'IpfsHash' menjadi 'cid'
    return {
      ipfsHash: result.cid,
      fileSize: result.size,
    };
  }
}