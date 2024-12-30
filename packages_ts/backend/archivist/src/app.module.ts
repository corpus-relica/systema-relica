import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConceptController } from './concept/concept.controller.js';
import { ConceptService } from './concept/concept.service.js';

import { Neo4jModule } from 'nest-neo4j';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TransactionModule } from './transaction/transaction.module.js';

import { CacheService } from './cache/cache.service.js';
import { GraphService } from './graph/graph.service.js';

import { AppInitService } from './app-init/app-init.service.js';
import { GellishBaseService } from './gellish-base/gellish-base.service.js';
import { DefinitionController } from './definition/definition.controller.js';
import { DefinitionService } from './definition/definition.service.js';
import { KindSearchController } from './kind-search/kind-search.controller.js';
import { KindSearchService } from './kind-search/kind-search.service.js';
import { ExecuteSearchQueryService } from './execute-search-query/execute-search-query.service.js';
import { IndividualSearchController } from './individual-search/individual-search.controller.js';
import { IndividualSearchService } from './individual-search/individual-search.service.js';
import { GeneralSearchController } from './general-search/general-search.controller.js';
import { GeneralSearchService } from './general-search/general-search.service.js';
import { FactController } from './fact/fact.controller.js';
import { FactService } from './fact/fact.service.js';
import { EntityRetrievalController } from './entity-retrieval/entity-retrieval.controller.js';
import { EntityRetrievalService } from './entity-retrieval/entity-retrieval.service.js';
import { CompletionService } from './completion/completion.service.js';
import { CompletionController } from './completion/completion.controller.js';
import { ValidationController } from './validation/validation.controller.js';
import { ValidationService } from './validation/validation.service.js';
import { SubmissionController } from './submission/submission.controller.js';
import { SubmissionService } from './submission/submission.service.js';
import { UIDController } from './uid/uid.controller.js';
import { UIDService } from './uid/uid.service.js';
import { RawFactIngestionService } from './raw-fact-ingestion/raw-fact-ingestion.service.js';
import { XLSService } from './xls/xls.service.js';
import { FileService } from './file/file.service.js';
import { KindController } from './kind/kind.controller.js';
import { KindService } from './kind/kind.service.js';
import { KindsController } from './kinds/kinds.controller.js';
import { KindsService } from './kinds/kinds.service.js';
import { AspectController } from './aspect/aspect.controller.js';
import { AspectService } from './aspect/aspect.service.js';
import { LinearizationService } from './linearization/linearization.service.js';
import { QueryController } from './query/query.controller.js';
import { QueryService } from './query/query.service.js';
import { GellishToCypherConverter } from './query/GellishToCypherConverter.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndividualService } from './individual/individual.service.js';
import { IndividualController } from './individual/individual.controller.js';

///////////////////////////

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

///////////////////////////

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL,
      options: {
        password: process.env.REDIS_PASSWORD,
      },
    }),
    Neo4jModule.forRoot({
      scheme: 'bolt',
      host: process.env.NEO4J_HOST || 'neo4j',
      port: parseInt(process.env.NEO4J_PORT) || 7687,
      username: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    TransactionModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [
    AppController,
    ConceptController,
    DefinitionController,
    KindSearchController,
    IndividualSearchController,
    GeneralSearchController,
    FactController,
    EntityRetrievalController,
    CompletionController,
    ValidationController,
    SubmissionController,
    UIDController,
    KindController,
    KindsController,
    AspectController,
    QueryController,
    IndividualController,
  ],
  providers: [
    AppInitService,
    ConceptService,
    AppService,
    CacheService,
    GraphService,
    GellishBaseService,
    DefinitionService,
    KindSearchService,
    ExecuteSearchQueryService,
    IndividualSearchService,
    GeneralSearchService,
    FactService,
    EntityRetrievalService,
    CompletionService,
    ValidationService,
    SubmissionService,
    UIDService,
    RawFactIngestionService,
    XLSService,
    FileService,
    KindService,
    KindsService,
    AspectService,
    LinearizationService,
    QueryService,
    GellishToCypherConverter,
    IndividualService,
  ],
})
export class AppModule {}
