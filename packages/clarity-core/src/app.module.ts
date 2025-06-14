import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EventEmitterModule } from '@nestjs/event-emitter';

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

import { REPLModule } from './repl/repl.module';

import { StateModule } from './state/state.module';
import { AppState } from './state/appState.entity';

import { ModellingModule } from './modelling/modelling.module';
import { ModellingSession } from './modelling/modellingSession.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../../.env.local'],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'postgres',
      entities: [
        EnvFact,
        EnvModel,
        EnvSelectedEntity,
        AppState,
        ModellingSession,
      ],
      synchronize: true,
      dropSchema: false,
    }),
    EventsModule,
    EnvironmentModule,
    ModelModule,
    ArchivistModule,
    ArtificialIntelligenceModule,
    REPLModule,
    StateModule,
    ModellingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
