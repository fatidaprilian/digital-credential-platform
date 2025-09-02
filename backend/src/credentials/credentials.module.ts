// backend/src/credentials/credentials.module.ts
import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule], // Impor BlockchainModule di sini
  controllers: [CredentialsController],
  providers: [CredentialsService],
})
export class CredentialsModule {}