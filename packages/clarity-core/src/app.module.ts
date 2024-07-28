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
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.RELICA_POSTGRES_HOST,
      port: parseInt(process.env.RELICA_POSTGRES_PORT),
      username: process.env.RELICA_POSTGRES_USER,
      password: process.env.RELICA_POSTGRES_PASSWORD,
      database: process.env.RELICA_POSTGRES_DB_NAME,
      entities: [
        EnvFact,
        EnvModel,
        EnvSelectedEntity,
        AppState,
        ModellingSession,
      ],
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
