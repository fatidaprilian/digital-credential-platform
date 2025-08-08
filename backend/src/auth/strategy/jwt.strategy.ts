// Path: backend/src/auth/strategy/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      // --- PERUBAHAN DI SINI ---
      // Sertakan data relasi dari tabel Institution
      include: {
        institution: true,
      },
      // --------------------------
    });

    if (!user) {
      throw new UnauthorizedException();
    }
    
    // Objek 'user' sekarang akan berisi properti 'institution' jika ada
    const { passwordHash, ...result } = user;
    return result; // 'result' ini akan menjadi 'req.user' di controller
  }
}