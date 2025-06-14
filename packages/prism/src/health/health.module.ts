import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}