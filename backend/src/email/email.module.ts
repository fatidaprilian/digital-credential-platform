import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

@Global() // Membuat modul ini tersedia di seluruh aplikasi tanpa perlu mengimpornya di setiap modul
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}