import { Controller, Post, Body, ValidationPipe, UseGuards } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { MintCredentialDto } from './dto/mint-credential.dto';
import { AuthGuard } from '@nestjs/passport';
import { IssueCredentialDto } from './dto/issue-credential.dto';

@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  // Endpoint "pintar" yang baru untuk digunakan oleh frontend
  @Post('issue')
  @UseGuards(AuthGuard('jwt'))
  async issueCredential(@Body(new ValidationPipe()) issueDto: IssueCredentialDto) {
    const txHash = await this.credentialsService.issue(issueDto);
    return {
      message: 'Credential issued successfully!',
      transactionHash: txHash,
    };
  }

  // Endpoint "manual" yang lama, bisa kita hapus atau biarkan untuk internal testing
  @Post('mint')
  @UseGuards(AuthGuard('jwt'))
  async mintCredential(@Body(new ValidationPipe()) mintDto: MintCredentialDto) {
    const txHash = await this.credentialsService.mint(mintDto);
    return {
      message: 'Credential minting process started successfully!',
      transactionHash: txHash,
    };
  }
}