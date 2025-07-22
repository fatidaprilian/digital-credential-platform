import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { UserType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async signup(dto: AuthDto) {
    const userExists = await this.prisma.user.findUnique({
      where: {
        walletAddress: dto.email,
      },
    });

    if (userExists) {
      throw new ForbiddenException('Credentials taken');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        walletAddress: dto.email,
        email: dto.email,
        passwordHash: hashedPassword,
        userType: UserType.issuer_admin,
      },
    });

    const { passwordHash, ...result } = user;
    return { message: 'Signup successful!', user: result };
  }

  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress: dto.email,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credentials incorrect');
    }

    const pwMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!pwMatches) {
      throw new UnauthorizedException('Credentials incorrect');
    }

    // FIX: Pastikan email ada sebelum membuat token
    if (!user.email) {
      throw new UnauthorizedException('User email is not set');
    }

    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwt.signAsync(payload);
    return {
      access_token: token,
    };
  }
}