import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';

import { Neo4jModule } from 'nest-neo4j';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TransactionModule } from './transaction/transaction.module';
import { BasisModule } from './basis/basis.module';
import { WebSocketModule } from './websocket/websocket.module';

import { CacheService } from './cache/cache.service';
import { GraphService } from './graph/graph.service';
import { AppInitService } from './app-init/app-init.service';
import { GellishBaseService } from './gellish-base/gellish-base.service';
import { DefinitionService } from './definition/definition.service';
import { KindSearchService } from './kind-search/kind-search.service';
import { ExecuteSearchQueryService } from './execute-search-query/execute-search-query.service';
import { IndividualSearchService } from './individual-search/individual-search.service';
import { GeneralSearchService } from './general-search/general-search.service';
import { FactService } from './fact/fact.service';
import { EntityRetrievalService } from './entity-retrieval/entity-retrieval.service';
import { CompletionService } from './completion/completion.service';
import { ValidationService } from './validation/validation.service';
import { SubmissionService } from './submission/submission.service';
import { UIDService } from './uid/uid.service';
import { KindService } from './kind/kind.service';
import { KindsService } from './kinds/kinds.service';
import { AspectService } from './aspect/aspect.service';
import { LinearizationService } from './linearization/linearization.service';
import { QueryService } from './query/query.service';
import { GellishToCypherConverter } from './query/GellishToCypherConverter';
import { ConceptService } from './concept/concept.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../../.env.local'],
    }),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      options: {
        password: process.env.REDIS_PASSWORD || 'redis',
      },
    }),
    Neo4jModule.forRoot({
      scheme: 'neo4j',
      host: process.env.NEO4J_HOST || 'localhost',
      port: parseInt(process.env.NEO4J_PORT) || 7687,
      username: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'postgres',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    TransactionModule,
    BasisModule,
    WebSocketModule,
  ],
  controllers: [], // No more REST controllers - WebSocket only!
  providers: [],
})
export class AppModule {}