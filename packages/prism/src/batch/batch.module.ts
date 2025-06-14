import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';

@Module({
  providers: [BatchService],
  controllers: [BatchController],
  exports: [BatchService],
})
export class BatchModule {}