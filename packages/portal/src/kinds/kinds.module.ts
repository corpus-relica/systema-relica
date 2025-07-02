import { Module } from '@nestjs/common';
import { KindsController } from './kinds.controller';
import { KindsService } from './kinds.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [KindsController],
  providers: [KindsService],
  exports: [KindsService],
})
export class KindsModule {}