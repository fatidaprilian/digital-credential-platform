// backend/src/blockchain/blockchain.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import * as VerifiableCredentialABI from '../abi/VerifiableCredential.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  public contract: Contract;
  private readonly logger = new Logger(BlockchainService.name);
  public provider: JsonRpcProvider;
  private wallet: Wallet;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>('POLYGON_AMOY_RPC_URL');
    const privateKey = this.configService.get<string>('DEPLOYER_PRIVATE_KEY');
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

    if (!rpcUrl || !privateKey || !contractAddress) {
      this.logger.error('Blockchain environment variables are not set!');
      throw new Error('Blockchain environment variables are not set!');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      contractAddress,
      VerifiableCredentialABI.abi,
      this.wallet,
    );

    this.logger.log(`Successfully connected to contract at ${contractAddress}`);
  }
}