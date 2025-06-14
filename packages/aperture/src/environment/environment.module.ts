import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentService } from './environment.service';
import { Environment } from './entities/environment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Environment])],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}