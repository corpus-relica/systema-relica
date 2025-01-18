import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { EventsModule } from './events/events.module.js';

import { EnvironmentModule } from './environment/environment.module.js';
import { EnvFact } from './environment/envFact.entity.js';
import { EnvModel } from './environment/envModel.entity.js';
import { EnvSelectedEntity } from './environment/envSelectedEntity.entity.js';

import { ModelModule } from './model/model.module.js';
import { ArchivistModule } from './archivist/archivist.module.js';

import { ArtificialIntelligenceModule } from './artificialIntelligence/artificialIntelligence.module.js';

import { REPLModule } from './repl/repl.module.js';

import { StateModule } from './state/state.module.js';
import { AppState } from './state/appState.entity.js';

import { ModellingModule } from './modelling/modelling.module.js';
import { ModellingSession } from './modelling/modellingSession.entity.js';

import { UserEnvironment } from './environment/user-environment.entity.js';
import { User } from './environment/user.entity.js';

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
        UserEnvironment,
        User,
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
