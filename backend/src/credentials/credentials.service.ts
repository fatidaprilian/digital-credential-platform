import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MintCredentialDto } from './dto/mint-credential.dto';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import * as sharp from 'sharp';
import { CredentialTemplate } from '@prisma/client';

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly prisma: PrismaService,
    private readonly ipfsService: IpfsService,
  ) {}

  async issue(issueDto: IssueCredentialDto): Promise<string> {
    this.logger.log(`Starting issuance process for template ID: ${issueDto.templateId}`);

    // 1. Ambil data template dari database
    const template = await this.prisma.credentialTemplate.findUnique({
      where: { id: issueDto.templateId },
    });

    if (!template || !template.ipfsTemplateHash || !template.dynamicFields) {
      throw new NotFoundException('Template not found or is incomplete.');
    }

    // 2. Buat gambar sertifikat final
    const finalImageBuffer = await this.createCredentialImage(
      template,
      issueDto.dynamicData,
    );
    
    // 3. Upload gambar final ke IPFS
    const imageUploadResult = await this.ipfsService.uploadFile({
      buffer: finalImageBuffer,
      originalname: `credential-${issueDto.recipientAddress}-${Date.now()}.png`,
      mimetype: 'image/png',
    } as Express.Multer.File);
    this.logger.log(`Final image uploaded to IPFS: ${imageUploadResult.ipfsHash}`);

    // 4. Buat dan upload metadata JSON
    const metadata = {
      name: `${template.name} for ${issueDto.dynamicData['Nama Lengkap'] || issueDto.recipientAddress}`,
      description: template.description,
      image: `ipfs://${imageUploadResult.ipfsHash}`,
      attributes: Object.entries(issueDto.dynamicData).map(([key, value]) => ({
        trait_type: key,
        value: value,
      })),
    };
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const metadataUploadResult = await this.ipfsService.uploadFile({
      buffer: metadataBuffer,
      originalname: `metadata-${Date.now()}.json`,
      mimetype: 'application/json',
    } as Express.Multer.File);
    this.logger.log(`Metadata uploaded to IPFS: ${metadataUploadResult.ipfsHash}`);

    // 5. Panggil logika minting dengan tokenURI final
    const tokenURI = `ipfs://${metadataUploadResult.ipfsHash}`;
    const mintDto: MintCredentialDto = {
      to: issueDto.recipientAddress,
      tokenURI: tokenURI,
    };
    
    return this.mint(mintDto);
  }

  private async createCredentialImage(
    template: CredentialTemplate,
    dynamicData: Record<string, string>,
  ): Promise<Buffer> {
    // Ambil gambar latar dari IPFS
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${template.ipfsTemplateHash}`);
    if (!response.ok) throw new Error('Failed to fetch template image from IPFS');
    const imageBuffer = await response.arrayBuffer();

    // Baca dimensi gambar latar
    const background = sharp(Buffer.from(imageBuffer));
    const metadata = await background.metadata();
    const width = metadata.width;
    const height = metadata.height;

    if (!width || !height) {
      throw new Error('Could not determine image dimensions');
    }

    const dynamicFields = template.dynamicFields as { name: string; x: number; y: number }[];
    
    // Siapkan elemen teks SVG untuk "ditulis" di atas gambar
    const textElements = dynamicFields.map(field => {
      const value = dynamicData[field.name] || '';
      // Gunakan dimensi gambar untuk membuat SVG yang pas
      const svgText = `
        <svg width="${width}" height="${height}">
          <text x="${field.x}" y="${field.y}" font-family="Arial" font-size="20" fill="black">${value}</text>
        </svg>
      `;
      return {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      };
    });

    // Gunakan Sharp untuk menggabungkan gambar latar dengan elemen-elemen teks
    const finalImage = await background
      .composite(textElements)
      .png()
      .toBuffer();

    return finalImage;
  }
  
  async mint(mintCredentialDto: MintCredentialDto): Promise<string> {
    const { to, tokenURI } = mintCredentialDto;

    this.logger.log(`Attempting to mint credential with tokenURI ${tokenURI} to ${to}`);

    try {
      const tx = await this.blockchainService.contract.issueCredential(
        to,
        tokenURI,
      );
      
      this.logger.log(`Transaction sent! Hash: ${tx.hash}`);
      await tx.wait();
      
      this.logger.log(`Transaction mined! Credential minted successfully.`);
      return tx.hash;
    } catch (error) {
      this.logger.error('Failed to mint credential', error);
      throw new Error('Failed to execute minting transaction.');
    }
  }
}
