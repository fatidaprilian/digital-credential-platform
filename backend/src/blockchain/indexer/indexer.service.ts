import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlockchainService } from '../blockchain.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventLog } from 'ethers'; // <-- 1. Impor tipe EventLog

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private lastCheckedBlock: bigint;

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const currentBlockNumber = await this.blockchainService.provider.getBlockNumber();
    this.lastCheckedBlock = BigInt(currentBlockNumber);
    this.logger.log(`Initial block height set to: ${this.lastCheckedBlock}`);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    this.logger.log(`Checking for new events from block ${this.lastCheckedBlock + 1n}...`);
    
    try {
      const currentBlockNumber = await this.blockchainService.provider.getBlockNumber();
      const currentBlock = BigInt(currentBlockNumber);

      if (currentBlock <= this.lastCheckedBlock) {
        this.logger.log('No new blocks to check.');
        return;
      }

      const eventFilter = this.blockchainService.contract.filters.CredentialIssued();
      const events = (await this.blockchainService.contract.queryFilter(
        eventFilter,
        this.lastCheckedBlock + 1n,
        currentBlock,
      )) as EventLog[]; // <-- 2. Tambahkan type assertion di sini

      if (events.length > 0) {
        this.logger.log(`Found ${events.length} new CredentialIssued event(s).`);
        for (const event of events) {
          const [tokenId, to] = event.args; // Baris ini sekarang aman
          const transactionHash = event.transactionHash;

          const existingLog = await this.prisma.issuanceLog.findFirst({
            where: { transactionHash },
          });

          if (!existingLog) {
            await this.prisma.issuanceLog.create({
              data: {
                credentialId: tokenId,
                recipientAddress: to,
                transactionHash: transactionHash,
                status: 'confirmed',
                templateId: 1, // Placeholder
              },
            });
            this.logger.log(`Saved new issuance for tokenId ${tokenId} to database.`);
          }
        }
      }

      this.lastCheckedBlock = currentBlock;
    } catch (error) {
      this.logger.error('Error during event polling:', error);
    }
  }
}