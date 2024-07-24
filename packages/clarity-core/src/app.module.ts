import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { EventsModule } from './events/events.module';

import { EnvironmentModule } from './environment/environment.module';
import { EnvFact } from './environment/envFact.entity';
import { EnvModel } from './environment/envModel.entity';
import { EnvSelectedEntity } from './environment/envSelectedEntity.entity';

import { ModelModule } from './model/model.module';
import { ArchivistModule } from './archivist/archivist.module';

import { ArtificialIntelligenceModule } from './artificialIntelligence/artificialIntelligence.module';

import { DSLVMModule } from './dslvm/dslvm.module';
import { SemanticModelModule } from './semanticModel/semanticModel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.RELICA_POSTGRES_HOST,
      port: parseInt(process.env.RELICA_POSTGRES_PORT),
      username: process.env.RELICA_POSTGRES_USER,
      password: process.env.RELICA_POSTGRES_PASSWORD,
      database: process.env.RELICA_POSTGRES_DB_NAME,
      entities: [EnvFact, EnvModel, EnvSelectedEntity],
    }),
    EventsModule,
    EnvironmentModule,
    ModelModule,
    ArchivistModule,
    ArtificialIntelligenceModule,
    DSLVMModule,
    SemanticModelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
