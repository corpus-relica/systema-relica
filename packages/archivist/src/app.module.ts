import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConceptController } from './concept/concept.controller';
import { ConceptService } from './concept/concept.service';

import { Neo4jModule } from 'nest-neo4j';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TransactionModule } from './transaction/transaction.module';

import { CacheService } from './cache/cache.service';
import { GraphService } from './graph/graph.service';

import { AppInitService } from './app-init/app-init.service';
import { GellishBaseService } from './gellish-base/gellish-base.service';
import { DefinitionController } from './definition/definition.controller';
import { DefinitionService } from './definition/definition.service';
import { KindSearchController } from './kind-search/kind-search.controller';
import { KindSearchService } from './kind-search/kind-search.service';
import { ExecuteSearchQueryService } from './execute-search-query/execute-search-query.service';
import { IndividualSearchController } from './individual-search/individual-search.controller';
import { IndividualSearchService } from './individual-search/individual-search.service';
import { GeneralSearchController } from './general-search/general-search.controller';
import { GeneralSearchService } from './general-search/general-search.service';
import { FactController } from './fact/fact.controller';
import { FactService } from './fact/fact.service';
import { EntityRetrievalController } from './entity-retrieval/entity-retrieval.controller';
import { EntityRetrievalService } from './entity-retrieval/entity-retrieval.service';
import { CompletionService } from './completion/completion.service';
import { CompletionController } from './completion/completion.controller';
import { ValidationController } from './validation/validation.controller';
import { ValidationService } from './validation/validation.service';
import { SubmissionController } from './submission/submission.controller';
import { SubmissionService } from './submission/submission.service';
import { UIDController } from './uid/uid.controller';
import { UIDService } from './uid/uid.service';
import { RawFactIngestionService } from './raw-fact-ingestion/raw-fact-ingestion.service';
import { XLSService } from './xls/xls.service';
import { FileService } from './file/file.service';
import { KindController } from './kind/kind.controller';
import { KindService } from './kind/kind.service';
import { KindsController } from './kinds/kinds.controller';
import { KindsService } from './kinds/kinds.service';
import { AspectController } from './aspect/aspect.controller';
import { AspectService } from './aspect/aspect.service';
import { LinearizationService } from './linearization/linearization.service';
import { QueryController } from './query/query.controller';
import { QueryService } from './query/query.service';
import { GellishToCypherConverter } from './query/GellishToCypherConverter';

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
      scheme: 'neo4j',
      host: process.env.NEO4J_HOST, //'localhost', //'neo4j',
      port: process.env.NEO4J_PORT, //7687,
      username: process.env.NEO4J_USER, //'neo4j',
      password: process.env.NEO4J_PASSWORD, //'password',
    }),
    TransactionModule,
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
  ],
})
export class AppModule {}
