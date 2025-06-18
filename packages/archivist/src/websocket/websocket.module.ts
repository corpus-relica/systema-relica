import { Module } from '@nestjs/common';
import { ArchivistGateway } from './archivist.gateway';
import { FactHandlers } from './handlers/fact.handlers';
import { SearchHandlers } from './handlers/search.handlers';
import { QueryHandlers } from './handlers/query.handlers';
import { ValidationHandlers } from './handlers/validation.handlers';
import { CompletionHandlers } from './handlers/completion.handlers';
import { ConceptHandlers } from './handlers/concept.handlers';
import { DefinitionHandlers } from './handlers/definition.handlers';
import { KindHandlers } from './handlers/kind.handlers';
import { SubmissionHandlers } from './handlers/submission.handlers';
import { TransactionHandlers } from './handlers/transaction.handlers';
import { UIDHandlers } from './handlers/uid.handlers';
import { LineageHandlers } from './handlers/lineage.handlers';

// Import all the services that handlers depend on
import { FactService } from '../fact/fact.service';
import { GeneralSearchService } from '../general-search/general-search.service';
import { IndividualSearchService } from '../individual-search/individual-search.service';
import { KindSearchService } from '../kind-search/kind-search.service';
import { ExecuteSearchQueryService } from '../execute-search-query/execute-search-query.service';
import { QueryService } from '../query/query.service';
import { ValidationService } from '../validation/validation.service';
import { CompletionService } from '../completion/completion.service';
import { GraphService } from '../graph/graph.service';
import { CacheService } from '../cache/cache.service';
import { GellishBaseService } from '../gellish-base/gellish-base.service';
import { UIDService } from '../uid/uid.service';
import { LinearizationService } from '../linearization/linearization.service';
import { GellishToCypherConverter } from '../query/GellishToCypherConverter';
import { ConceptService } from '../concept/concept.service';
import { DefinitionService } from '../definition/definition.service';
import { EntityRetrievalService } from '../entity-retrieval/entity-retrieval.service';
import { KindService } from '../kind/kind.service';
import { KindsService } from '../kinds/kinds.service';
import { AspectService } from '../aspect/aspect.service';
import { SubmissionService } from '../submission/submission.service';
import { TransactionService } from '../transaction/transaction.service';

@Module({
  providers: [
    ArchivistGateway,
    // Handler classes
    FactHandlers,
    SearchHandlers,
    QueryHandlers,
    ValidationHandlers,
    CompletionHandlers,
    ConceptHandlers,
    DefinitionHandlers,
    KindHandlers,
    SubmissionHandlers,
    TransactionHandlers,
    UIDHandlers,
    LineageHandlers,
    // Core services
    FactService,
    GeneralSearchService,
    IndividualSearchService,
    KindSearchService,
    ExecuteSearchQueryService,
    QueryService,
    ValidationService,
    CompletionService,
    ConceptService,
    DefinitionService,
    EntityRetrievalService,
    KindService,
    KindsService,
    AspectService,
    SubmissionService,
    TransactionService,
    GraphService,
    CacheService,
    GellishBaseService,
    UIDService,
    LinearizationService,
    GellishToCypherConverter,
  ],
  exports: [ArchivistGateway],
})
export class WebSocketModule {}