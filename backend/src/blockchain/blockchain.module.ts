// backend/src/blockchain/blockchain.module.ts
import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { ConfigModule } from '@nestjs/config';
import { IndexerService } from './indexer/indexer.service'; // <-- 1. Impor IndexerService

@Module({
  imports: [ConfigModule],
  providers: [
    BlockchainService, 
    IndexerService // <-- 2. Tambahkan di sini
  ],
  exports: [BlockchainService, IndexerService],
})
export class BlockchainModule {}