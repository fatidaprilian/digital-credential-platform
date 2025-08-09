// Path: backend/src/credentials/credentials.controller.ts

import { Controller, Post, Body, ValidationPipe, UseGuards, Req, Get, Param, NotFoundException } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { MintCredentialDto } from './dto/mint-credential.dto';
import { AuthGuard } from '@nestjs/passport';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { Request } from 'express';
import { User } from '@prisma/client';
import { IssueCredentialBatchDto } from './dto/issue-credential-batch.dto';

@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  /**
   * --- ENDPOINT BARU ---
   * Mengambil detail (termasuk publicId) untuk sekumpulan tokenId.
   * Digunakan oleh halaman galeri holder untuk mencocokkan on-chain ID dengan public ID.
   */
  @Post('batch-details')
  async getBatchDetails(@Body() body: { tokenIds: string[] }) {
    return this.credentialsService.getBatchDetailsByTokenIds(body.tokenIds);
  }

  /**
   * Endpoint untuk verifikasi publik.
   * Parameter ':tokenId' di sini akan diterima sebagai publicId (UUID) dari frontend.
   */
  @Get('log/:tokenId')
  async getIssuanceLog(@Param('tokenId') tokenId: string) {
    try {
        // Memanggil service yang sudah direvisi untuk mencari berdasarkan publicId
        return await this.credentialsService.getIssuanceLogByTokenId(tokenId);
    } catch (error) {
        if (error instanceof NotFoundException) {
            throw new NotFoundException(error.message);
        }
        throw error;
    }
  }

  /**
   * Endpoint untuk mengambil riwayat penerbitan institusi.
   */
  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  async getHistory(@Req() req: Request) {
    const user = req.user as User;
    return this.credentialsService.getHistoryForInstitution(user);
  }

  /**
   * Endpoint untuk menerbitkan kredensial secara batch.
   */
  @Post('issue-batch')
  @UseGuards(AuthGuard('jwt'))
  async issueCredentialBatch(
    @Body(new ValidationPipe()) issueBatchDto: IssueCredentialBatchDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const result = await this.credentialsService.issueBatch(issueBatchDto, user);
    return {
      message: 'Proses penerbitan kredensial batch berhasil dimulai!',
      ...result,
    };
  }

  /**
   * Endpoint untuk menerbitkan satu kredensial.
   */
  @Post('issue')
  @UseGuards(AuthGuard('jwt'))
  async issueCredential(
    @Body(new ValidationPipe()) issueDto: IssueCredentialDto,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const txHash = await this.credentialsService.issue(issueDto, user);
    return {
      message: 'Credential issued successfully!',
      transactionHash: txHash,
    };
  }

  /**
   * Endpoint legacy/internal untuk minting langsung (jika masih diperlukan).
   */
  @Post('mint')
  @UseGuards(AuthGuard('jwt'))
  async mintCredential(@Body(new ValidationPipe()) mintDto: MintCredentialDto) {
    const { txHash } = await this.credentialsService.mint(mintDto);
    return {
      message: 'Credential minting process started successfully!',
      transactionHash: txHash,
    };
  }
}
