// Path: backend/src/auth/guard/admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { User, UserType } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    // Periksa apakah user ada dan tipenya adalah platform_admin
    if (user && user.userType === UserType.platform_admin) {
      return true;
    }

    // Jika tidak, lempar error Forbidden
    throw new ForbiddenException('Akses ditolak. Hanya untuk admin platform.');
  }
}
