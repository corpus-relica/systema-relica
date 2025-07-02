import { Module } from '@nestjs/common';
import { PrismController } from './prism.controller';
import { PrismService } from './prism.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [PrismController],
  providers: [PrismService],
  exports: [PrismService],
})
export class PrismModule {}