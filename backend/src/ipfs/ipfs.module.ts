import { Global, Module } from '@nestjs/common';
import { IpfsService } from './ipfs.service';

@Global() // <-- Jadikan Global
@Module({
  providers: [IpfsService],
  exports: [IpfsService], // <-- Ekspor service-nya
})
export class IpfsModule {}