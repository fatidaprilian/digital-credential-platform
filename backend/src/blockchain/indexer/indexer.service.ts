// Path: backend/src/blockchain/indexer/indexer.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlockchainService } from '../blockchain.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventLog } from 'ethers';

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
        // Tidak ada blok baru, tidak perlu melakukan apa-apa
        return;
      }
      
      // --- PERBAIKAN: Memindai event tunggal dan batch ---
      const singleIssueFilter = this.blockchainService.contract.filters.CredentialIssued();
      const batchIssueFilter = this.blockchainService.contract.filters.CredentialBatchIssued();

      const singleEvents = (await this.blockchainService.contract.queryFilter(
        singleIssueFilter,
        this.lastCheckedBlock + 1n,
        currentBlock,
      )) as EventLog[];

      const batchEvents = (await this.blockchainService.contract.queryFilter(
        batchIssueFilter,
        this.lastCheckedBlock + 1n,
        currentBlock
      )) as EventLog[];

      if (singleEvents.length > 0 || batchEvents.length > 0) {
        this.logger.log(`Found ${singleEvents.length} single and ${batchEvents.length} batch event(s).`);

        // Gabungkan semua hash transaksi unik untuk diperiksa
        const allTxHashes = new Set([
            ...singleEvents.map(e => e.transactionHash),
            ...batchEvents.map(e => e.transactionHash)
        ]);

        for (const transactionHash of allTxHashes) {
          // --- KUNCI PERBAIKAN: Periksa apakah log sudah ada ---
          const existingLog = await this.prisma.issuanceLog.findFirst({
            where: { transactionHash },
          });

          // Hanya proses jika log BELUM ADA. Ini mencegah race condition.
          if (!existingLog) {
              // Indexer bertindak sebagai fallback. Jika API gagal mencatat log karena suatu alasan,
              // Indexer akan menangkapnya. Namun, Indexer tidak memiliki konteks `templateId`.
              // Oleh karena itu, kita hanya akan mencatat peringatan.
              this.logger.warn(
                `Indexer found a new transaction (${transactionHash}) that was not logged by the API. ` +
                `This might indicate an issue during API-side logging. Manual check may be required.`
              );
          }
        }
      }

      this.lastCheckedBlock = currentBlock;
    } catch (error) {
      this.logger.error('Error during event polling:', error);
    }
  }
}