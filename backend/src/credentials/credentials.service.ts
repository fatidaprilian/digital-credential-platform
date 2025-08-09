// Path: backend/src/credentials/credentials.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MintCredentialDto } from './dto/mint-credential.dto';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import * as sharp from 'sharp';
import { CredentialTemplate, User } from '@prisma/client';
import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';
import { TransactionReceipt } from 'ethers';
import { IssueCredentialBatchDto } from './dto/issue-credential-batch.dto';

// --- Definisi Interface ---
interface OverlayElement {
  input: Buffer; top: number; left: number;
}
interface TemplateComponent {
  id: string; type: string; x: number; y: number; width: number; height: number;
  content?: string; fieldName?: string; label?: string; placeholder?: string;
  isRequired?: boolean; style?: any;
}
interface TemplateData {
  components: TemplateComponent[];
  backgroundImage?: string;
  dynamicFields?: any[];
}

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly prisma: PrismaService,
    private readonly ipfsService: IpfsService,
  ) {}

  // --- FUNGSI BARU DITAMBAHKAN DI SINI ---
  /**
   * Mengambil detail (termasuk publicId) untuk sekumpulan tokenId.
   * Digunakan oleh halaman galeri holder.
   */
  async getBatchDetailsByTokenIds(tokenIds: string[]) {
    if (!tokenIds || tokenIds.length === 0) {
      return [];
    }

    const credentialIds = tokenIds.map(id => BigInt(id));

    const logs = await this.prisma.issuanceLog.findMany({
      where: {
        credentialId: {
          in: credentialIds,
        },
      },
      select: {
        credentialId: true,
        publicId: true,
      },
    });

    // Mengubah BigInt menjadi string agar aman saat dikirim sebagai JSON
    return logs.map(log => ({
      credentialId: log.credentialId.toString(),
      publicId: log.publicId,
    }));
  }

  async getHistoryForInstitution(user: User) {
    if (!user.institutionId) {
      throw new BadRequestException('User tidak terhubung dengan institusi manapun.');
    }
    const logs = await this.prisma.issuanceLog.findMany({
      where: { template: { institutionId: user.institutionId } },
      include: { template: { select: { name: true } } },
      orderBy: { issuedAt: 'desc' },
    });
    return logs.map(log => ({
      ...log,
      credentialId: log.credentialId ? log.credentialId.toString() : null,
    }));
  }

  async getIssuanceLogByTokenId(publicId: string) {
    const log = await this.prisma.issuanceLog.findUnique({
      where: { publicId },
    });
    if (!log) {
      throw new NotFoundException(`Kredensial dengan ID ${publicId} tidak ditemukan.`);
    }
    return {
      transactionHash: log.transactionHash,
      issuedAt: log.issuedAt,
      onChainTokenId: log.credentialId.toString(),
    };
  }

  // ... (Sisa fungsi issue, issueBatch, mint, dll. tidak ada perubahan)
  // [PASTIKAN ANDA MENYALIN FUNGSI BARU DI ATAS DAN MEMBIARKAN FUNGSI LAINNYA TETAP ADA]
  async issueBatch(issueBatchDto: IssueCredentialBatchDto, user: User): Promise<{ txHash: string; count: number }> {
    const { batch } = issueBatchDto;
    const batchSize = batch.length;

    if (batchSize === 0) {
      throw new BadRequestException('Batch tidak boleh kosong.');
    }
    if (!user.institutionId) {
      throw new BadRequestException('User tidak terhubung dengan institusi manapun.');
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: user.institutionId },
    });
    if (!institution) {
      throw new NotFoundException('Institusi tidak ditemukan.');
    }

    const hasActiveSubscription = institution.subscriptionExpiresAt && new Date(institution.subscriptionExpiresAt) > new Date();

    if (!hasActiveSubscription && institution.issuanceCredits < batchSize) {
      throw new ForbiddenException(`Kredit penerbitan tidak mencukupi. Dibutuhkan: ${batchSize}, Tersedia: ${institution.issuanceCredits}.`);
    }

    this.logger.log(`Memproses batch berisi ${batchSize} kredensial untuk diunggah ke IPFS...`);

    const processedCredentials = await Promise.all(
      batch.map(async (issueDto) => {
        const { templateId, recipientAddress, dynamicData } = issueDto;
        const template = await this.prisma.credentialTemplate.findFirst({
          where: { id: templateId, institutionId: institution.id },
        });
        if (!template || !template.ipfsTemplateHash) {
          throw new NotFoundException(`Template dengan ID ${templateId} tidak ditemukan atau tidak dapat diakses.`);
        }
        const finalImageBuffer = await this.createCredentialImage(template, dynamicData);
        const imageUploadResult = await this.ipfsService.uploadFile({
          buffer: finalImageBuffer, originalname: `credential-${recipientAddress}-${Date.now()}.png`, mimetype: 'image/png',
        } as Express.Multer.File);

        const metadata = {
          name: `${template.name} for ${dynamicData['student_name'] || dynamicData['nama'] || recipientAddress}`,
          description: template.description,
          image: `ipfs://${imageUploadResult.ipfsHash}`,
          attributes: Object.entries(dynamicData).map(([key, value]) => ({
            trait_type: key, value: typeof value === 'string' ? value : JSON.stringify(value),
          })),
        };
        const metadataBuffer = Buffer.from(JSON.stringify(metadata));
        const metadataUploadResult = await this.ipfsService.uploadFile({
          buffer: metadataBuffer, originalname: `metadata-${recipientAddress}-${Date.now()}.json`, mimetype: 'application/json',
        } as Express.Multer.File);
        const tokenURI = `ipfs://${metadataUploadResult.ipfsHash}`;
        return { recipientAddress, tokenURI, templateId };
      }),
    );

    this.logger.log('Semua kredensial berhasil diproses. Memanggil smart contract untuk batch mint...');

    const recipientAddresses = processedCredentials.map((c) => c.recipientAddress);
    const tokenURIs = processedCredentials.map((c) => c.tokenURI);

    const { txHash, fromTokenId } = await this.mintBatch(recipientAddresses, tokenURIs);

    try {
      await this.prisma.$transaction(async (prisma) => {
        if (!hasActiveSubscription) {
          await prisma.institution.update({
            where: { id: institution.id },
            data: { issuanceCredits: { decrement: batchSize } },
          });
        }
        
        await prisma.issuanceLog.createMany({
          data: processedCredentials.map((cred, index) => ({
            credentialId: fromTokenId + BigInt(index),
            templateId: cred.templateId,
            recipientAddress: cred.recipientAddress,
            transactionHash: txHash,
            status: 'confirmed',
          })),
        });
      });
      this.logger.log(`Log & pengurangan kredit untuk batch tx ${txHash} berhasil.`);
    } catch (error) {
      this.logger.error(`KRITIS: Gagal mencatat log transaksi atau mengurangi kredit untuk tx ${txHash}. Institusi ID: ${institution.id}`, error);
    }
    return { txHash, count: batchSize };
  }

  async mintBatch(tos: string[], tokenURIs: string[]): Promise<{ txHash: string; fromTokenId: bigint; toTokenId: bigint }> {
    let tx;
    try {
      tx = await this.blockchainService.contract.issueCredentialBatch(tos, tokenURIs);
      this.logger.log(`Transaksi batch minting dikirim. Hash: ${tx.hash}. Menunggu konfirmasi...`);
      
      const receipt = await tx.wait();
      
      const findBatchEvent = (receipt: TransactionReceipt): { fromTokenId: bigint; toTokenId: bigint } | undefined => {
          if (!receipt || !receipt.logs) return undefined;
          for (const log of receipt.logs) {
              try {
                  const parsedLog = this.blockchainService.contract.interface.parseLog(log);
                  if (parsedLog && parsedLog.name === 'CredentialBatchIssued') {
                      this.logger.log(`✅ Event 'CredentialBatchIssued' ditemukan.`);
                      const [fromTokenId, toTokenId] = parsedLog.args;
                      return { fromTokenId: BigInt(fromTokenId), toTokenId: BigInt(toTokenId) };
                  }
              } catch (e) { /* Abaikan error parsing log lain */ }
          }
          return undefined;
      };

      const eventData = findBatchEvent(receipt);

      if (!eventData) {
        this.logger.error(`KRITIS: Gagal mem-parsing event 'CredentialBatchIssued' dari tx: ${tx.hash}.`);
        throw new Error(`Event 'CredentialBatchIssued' tidak ditemukan dari transaksi ${tx.hash}.`);
      }

      this.logger.log(`Batch credential berhasil di-mint! Tx Hash: ${tx.hash}, Token IDs: ${eventData.fromTokenId} - ${eventData.toTokenId}`);
      return { txHash: tx.hash, ...eventData };

    } catch (error) {
      this.logger.error('Proses batch minting gagal total', {
        message: error.message,
        stack: error.stack,
        transactionHash: tx ? tx.hash : 'N/A',
      });
      throw new Error(`Gagal mengeksekusi transaksi batch minting: ${error.message}`);
    }
  }

  async issue(issueDto: IssueCredentialDto, user: User): Promise<string> {
    const { templateId, recipientAddress, dynamicData } = issueDto;

    if (!user.institutionId) {
      throw new BadRequestException(
        'User tidak terhubung dengan institusi manapun.',
      );
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: user.institutionId },
    });

    if (!institution) {
      throw new NotFoundException('Institusi tidak ditemukan.');
    }

    const template = await this.prisma.credentialTemplate.findFirst({
      where: { id: templateId, institutionId: institution.id },
    });

    if (!template || !template.ipfsTemplateHash) {
      throw new NotFoundException('Template tidak ditemukan atau tidak lengkap.');
    }

    const hasActiveSubscription =
      institution.subscriptionExpiresAt &&
      new Date(institution.subscriptionExpiresAt) > new Date();

    if (!hasActiveSubscription && institution.issuanceCredits < 1) {
      throw new ForbiddenException(
        'Kredit penerbitan tidak mencukupi. Silakan isi ulang.',
      );
    }

    const finalImageBuffer = await this.createCredentialImage(
      template,
      dynamicData,
    );
    const imageUploadResult = await this.ipfsService.uploadFile({
      buffer: finalImageBuffer,
      originalname: `credential-${recipientAddress}-${Date.now()}.png`,
      mimetype: 'image/png',
    } as Express.Multer.File);

    const metadata = {
      name: `${template.name} for ${
        dynamicData['student_name'] || dynamicData['nama'] || recipientAddress
      }`,
      description: template.description,
      image: `ipfs://${imageUploadResult.ipfsHash}`,
      attributes: Object.entries(dynamicData).map(([key, value]) => ({
        trait_type: key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      })),
    };
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const metadataUploadResult = await this.ipfsService.uploadFile({
      buffer: metadataBuffer,
      originalname: `metadata-${Date.now()}.json`,
      mimetype: 'application/json',
    } as Express.Multer.File);
    const tokenURI = `ipfs://${metadataUploadResult.ipfsHash}`;

    const mintDto: MintCredentialDto = { to: recipientAddress, tokenURI };
    const { txHash, credentialId } = await this.mint(mintDto);

    try {
      await this.prisma.$transaction(async (prisma) => {
        if (!hasActiveSubscription) {
          await prisma.institution.update({
            where: { id: institution.id },
            data: { issuanceCredits: { decrement: 1 } },
          });
        }

        await prisma.issuanceLog.create({
          data: {
            credentialId: credentialId,
            templateId: template.id,
            recipientAddress,
            transactionHash: txHash,
            status: 'confirmed',
          },
        });
      });

      if (!hasActiveSubscription) {
        this.logger.log(
          `Kredit berhasil dikurangi untuk institusi ID: ${institution.id}. Transaksi: ${txHash}`,
        );
      } else {
        this.logger.log(
          `Penerbitan dengan langganan aktif untuk institusi ID: ${institution.id}. Transaksi: ${txHash}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `KRITIS: Gagal mencatat log transaksi atau mengurangi kredit untuk tx ${txHash}. Institusi ID: ${institution.id}`,
        error,
      );
    }

    return txHash;
  }
  
  private async createCredentialImage(
    template: CredentialTemplate,
    dynamicData: Record<string, string>,
  ): Promise<Buffer> {
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${template.ipfsTemplateHash}`;
    const response = await fetch(ipfsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch template data from IPFS: ${response.statusText}`);
    }

    const templateData: TemplateData = await response.json();
    const { components, backgroundImage } = templateData;

    if (!components || !backgroundImage) {
      throw new Error('Template data is incomplete. Missing components or background image.');
    }

    const base64Data = backgroundImage.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid background image data URI.');
    }
    const backgroundBuffer = Buffer.from(base64Data, 'base64');

    const bgImage = await loadImage(backgroundBuffer);
    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height);

    const imageOverlays: OverlayElement[] = [];

    for (const component of components) {
      const { type, x, y, width, height, fieldName, content, style } = component;

      if (type === 'static-text' && content) {
        this.drawTextOnCanvas(ctx, content, { x, y, width, height, style });
      } else if (type === 'dynamic-field' && fieldName && dynamicData[fieldName]) {
        const text = dynamicData[fieldName];
        this.drawTextOnCanvas(ctx, text, { x, y, width, height, style });
      } else if ((type === 'logo' || type === 'signature') && content && content.startsWith('data:image/')) {
        const imageBuffer = Buffer.from(content.split(',')[1], 'base64');
        const resizedImage = await sharp(imageBuffer)
          .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        imageOverlays.push({ input: resizedImage, top: y, left: x });
      } else if (type === 'image-placeholder' && fieldName && dynamicData[fieldName]) {
        const imageData = dynamicData[fieldName];
        if (imageData && imageData.startsWith('data:image/')) {
          const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
          const resizedImage = await sharp(imageBuffer)
            .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
          imageOverlays.push({ input: resizedImage, top: y, left: x });
        }
      }
    }

    const canvasWithTextBuffer = canvas.toBuffer('image/png');

    if (imageOverlays.length > 0) {
      return sharp(canvasWithTextBuffer).composite(imageOverlays).png().toBuffer();
    }

    return canvasWithTextBuffer;
  }
  
  private drawTextOnCanvas(ctx: CanvasRenderingContext2D, text: string, params: any) {
    const { x, y, width, height, style } = params;
    const fontSize = style?.fontSize || 14;

    ctx.fillStyle = style?.color || '#000000';
    const fontFamily = style?.fontFamily || 'sans-serif';
    ctx.font = `${style?.fontWeight || 'normal'} ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = style?.textAlign || 'left';

    ctx.textBaseline = 'middle';
    
    let textX = x;
    if (ctx.textAlign === 'center') {
      textX = x + width / 2;
    } else if (ctx.textAlign === 'right') {
      textX = x + width;
    }

    const textY = y + height / 2;
    ctx.fillText(text, textX, textY, width);
  }

  async mint(
    mintCredentialDto: MintCredentialDto,
  ): Promise<{ txHash: string; credentialId: bigint }> {
    const { to, tokenURI } = mintCredentialDto;
    let tx;

    try {
      tx = await this.blockchainService.contract.issueCredential(
        to,
        tokenURI,
      );
      this.logger.log(
        `Transaksi terkirim. Hash: ${tx.hash}. Menunggu konfirmasi...`,
      );

      const findEventInReceipt = (
        receipt: TransactionReceipt,
      ): bigint | undefined => {
        if (!receipt || !receipt.logs) {
          return undefined;
        }

        this.logger.log(`Menganalisis ${receipt.logs.length} log dari receipt...`);
        for (const [index, log] of receipt.logs.entries()) {
          try {
            const parsedLog =
              this.blockchainService.contract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'CredentialIssued') {
              this.logger.log(`✅ Event 'CredentialIssued' ditemukan pada log #${index}`);
              
              const tokenId = parsedLog.args[0];
              
              if (tokenId !== undefined) {
                return BigInt(tokenId);
              }

              this.logger.error(`🔥 Gagal mengambil tokenId dari argumen event!`);
            }
          } catch (e) {
              // Abaikan error parsing untuk log yang tidak relevan
          }
        }

        this.logger.warn(`❌ Setelah memeriksa semua log, event 'CredentialIssued' tidak ditemukan.`);
        return undefined;
      };

      const initialReceipt = await tx.wait();
      const credentialId = findEventInReceipt(initialReceipt);

      if (credentialId === undefined) {
        this.logger.error(
          `KRITIS: Gagal mem-parsing event dari tx: ${tx.hash}.`,
        );
        throw new Error(
          `Event 'CredentialIssued' tidak dapat diparsing dari transaksi ${tx.hash}.`,
        );
      }

      this.logger.log(
        `Credential minted! Tx Hash: ${tx.hash}, Credential ID: ${credentialId}`,
      );
      return { txHash: tx.hash, credentialId: credentialId };
    } catch (error) {
      this.logger.error('Gagal total saat proses minting', {
        message: error.message,
        stack: error.stack,
        transactionHash: tx ? tx.hash : 'N/A',
      });
      throw new Error(`Gagal mengeksekusi transaksi minting: ${error.message}`);
    }
  }
}