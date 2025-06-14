import { Module, forwardRef } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { BatchModule } from '../batch/batch.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    forwardRef(() => BatchModule),
    forwardRef(() => CacheModule),
  ],
  providers: [SetupService],
  controllers: [SetupController],
  exports: [SetupService],
})
export class SetupModule {}