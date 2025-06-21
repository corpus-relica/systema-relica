import { z } from 'zod';
import { PrismActions } from './services/prism';
import { ClarityActions } from './services/clarity';
import { 
  FactActions,
  SearchActions,
  ConceptActions,
  QueryActions,
  KindActions,
  UIDActions,
  CompletionActions,
  DefinitionActions,
  SubmissionActions,
  TransactionActions,
  ValidationActions,
  LineageActions,
  EntityActions,
  // Request schemas
  FactCreateRequestSchema,
  FactUpdateRequestSchema,
  FactDeleteRequestSchema,
  FactGetRequestSchema,
  FactGetSubtypesRequestSchema,
  FactGetSupertypesRequestSchema,
  FactGetClassifiedRequestSchema,
  FactValidateRequestSchema,
  FactBatchGetRequestSchema,
  FactCountRequestSchema,
  SearchGeneralRequestSchema,
  SearchIndividualRequestSchema,
  SearchKindRequestSchema,
  SearchExecuteRequestSchema,
  SearchUidRequestSchema,
  ConceptGetRequestSchema,
  ConceptCreateRequestSchema,
  ConceptUpdateRequestSchema,
  ConceptDeleteRequestSchema,
  QueryExecuteRequestSchema,
  QueryValidateRequestSchema,
  QueryParseRequestSchema,
  KindGetRequestSchema,
  KindsListRequestSchema,
  KindsSearchRequestSchema,
  UIDGenerateRequestSchema,
  UIDBatchRequestSchema,
  UIDReserveRequestSchema,
  CompletionRequestSchema,
  CompletionEntitiesRequestSchema,
  CompletionRelationsRequestSchema,
  DefinitionGetRequestSchema,
  DefinitionUpdateRequestSchema,
  SubmissionSubmitRequestSchema,
  SubmissionBatchRequestSchema,
  TransactionStartRequestSchema,
  TransactionCommitRequestSchema,
  TransactionRollbackRequestSchema,
  TransactionGetRequestSchema,
  ValidationValidateRequestSchema,
  ValidationCollectionRequestSchema,
  LineageGetRequestSchema,
  EntityBatchResolveRequestSchema,
  EntityCategoryGetRequestSchema,
  EntityTypeGetRequestSchema,
  EntityCollectionsGetRequestSchema,
  // Response schemas
  FactCreateResponseSchema,
  FactUpdateResponseSchema,
  FactDeleteResponseSchema,
  FactGetResponseSchema,
  FactGetSubtypesResponseSchema,
  FactGetSupertypesResponseSchema,
  FactGetClassifiedResponseSchema,
  FactValidateResponseSchema,
  FactBatchGetResponseSchema,
  FactCountResponseSchema,
  SearchGeneralResponseSchema,
  SearchIndividualResponseSchema,
  SearchKindResponseSchema,
  SearchExecuteResponseSchema,
  SearchUidResponseSchema,
  ConceptGetResponseSchema,
  ConceptCreateResponseSchema,
  ConceptUpdateResponseSchema,
  ConceptDeleteResponseSchema,
  QueryExecuteResponseSchema,
  QueryValidateResponseSchema,
  QueryParseResponseSchema,
  KindGetResponseSchema,
  KindsListResponseSchema,
  KindsSearchResponseSchema,
  UIDGenerateResponseSchema,
  UIDBatchResponseSchema,
  UIDReserveResponseSchema,
  CompletionResponseSchema,
  CompletionEntitiesResponseSchema,
  CompletionRelationsResponseSchema,
  DefinitionGetResponseSchema,
  DefinitionUpdateResponseSchema,
  SubmissionSubmitResponseSchema,
  SubmissionBatchResponseSchema,
  TransactionStartResponseSchema,
  TransactionCommitResponseSchema,
  TransactionRollbackResponseSchema,
  TransactionGetResponseSchema,
  ValidationValidateResponseSchema,
  ValidationCollectionResponseSchema,
  LineageGetResponseSchema,
  EntityBatchResolveResponseSchema,
  EntityCategoryGetResponseSchema,
  EntityTypeGetResponseSchema,
  EntityCollectionsGetResponseSchema,
} from './services/archivist';
import {
  ApertureActions,
  EnvironmentGetRequestSchema,
  EnvironmentListRequestSchema,
  EnvironmentCreateRequestSchema,
  EnvironmentClearRequestSchema,
  SearchLoadTextRequestSchema,
  SearchLoadUidRequestSchema,
  SpecializationLoadFactRequestSchema,
  SpecializationLoadRequestSchema,
  EntityLoadRequestSchema,
  EntityUnloadRequestSchema,
  EntitySelectRequestSchema,
  EntityDeselectRequestSchema,
  EntityLoadMultipleRequestSchema,
  EntityUnloadMultipleRequestSchema,
  SubtypeLoadRequestSchema,
  SubtypeLoadConeRequestSchema,
  SubtypeUnloadConeRequestSchema,
  ClassificationLoadRequestSchema,
  ClassificationLoadFactRequestSchema,
  CompositionLoadRequestSchema,
  CompositionLoadInRequestSchema,
  ConnectionLoadRequestSchema,
  ConnectionLoadInRequestSchema,
  RelationRequiredRolesLoadRequestSchema,
  RelationRolePlayersLoadRequestSchema,
  ApertureResponseSchema,
} from './services/aperture';

/**
 * Contract definition for a single WebSocket operation
 * Simplified approach: actions ARE the topics
 */
export interface MessageContract<TRequest = any, TResponse = any> {
  /** The action/topic string used by both Portal and Service */
  action: string;
  /** The service that handles this message */
  service: string;
  /** Zod schema for request validation */
  requestSchema: z.ZodSchema<TRequest>;
  /** Zod schema for response validation */
  responseSchema: z.ZodSchema<TResponse>;
  /** Human-readable description */
  description: string;
}

/**
 * Simplified registry for development validation only
 * Actions are now the actual topics - no mapping needed
 */
export const MESSAGE_REGISTRY = {
  // =====================================================
  // PRISM SERVICE CONTRACTS
  // =====================================================
  
  [PrismActions.GET_SETUP_STATUS]: {
    action: PrismActions.GET_SETUP_STATUS, // 'setup/get-status'
    service: 'prism',
    requestSchema: z.object({
      service: z.literal('prism'),
      action: z.literal(PrismActions.GET_SETUP_STATUS),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        status: z.string(),
        stage: z.string().nullable(),
        message: z.string(),
        progress: z.number(),
        error: z.string().optional(),
        timestamp: z.string(),
      }).optional(),
    }),
    description: 'Get current setup status from Prism service',
  },

  [PrismActions.RESET_SYSTEM]: {
    action: PrismActions.RESET_SYSTEM, // 'setup/reset-system'
    service: 'prism',
    requestSchema: z.object({
      service: z.literal('prism'),
      action: z.literal(PrismActions.RESET_SYSTEM),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      errors: z.array(z.string()).optional(),
      timestamp: z.string().optional(),
    }),
    description: 'Reset system state (clear databases)',
  },

  [PrismActions.START_SETUP]: {
    action: PrismActions.START_SETUP, // 'setup/start'
    service: 'prism',
    requestSchema: z.object({
      service: z.literal('prism'),
      action: z.literal(PrismActions.START_SETUP),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
    }),
    description: 'Start the setup process',
  },

  [PrismActions.CREATE_USER]: {
    action: PrismActions.CREATE_USER, // 'setup/create-user'
    service: 'prism',
    requestSchema: z.object({
      service: z.literal('prism'),
      action: z.literal(PrismActions.CREATE_USER),
      payload: z.object({
        username: z.string(),
        password: z.string(),
        confirmPassword: z.string(),
      }),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        message: z.string(),
        user: z.object({
          username: z.string(),
          role: z.string(),
        }),
      }).optional(),
      error: z.object({
        code: z.string(),
        type: z.string(),
        message: z.string(),
      }).optional(),
    }),
    description: 'Create admin user during setup',
  },

  // =====================================================
  // ARCHIVIST SERVICE CONTRACTS
  // =====================================================
  
  // Fact contracts
  [FactActions.CREATE]: {
    action: FactActions.CREATE,
    service: 'archivist',
    requestSchema: FactCreateRequestSchema,
    responseSchema: FactCreateResponseSchema,
    description: 'Create a new fact in the knowledge graph',
  },

  [FactActions.UPDATE]: {
    action: FactActions.UPDATE,
    service: 'archivist',
    requestSchema: FactUpdateRequestSchema,
    responseSchema: FactUpdateResponseSchema,
    description: 'Update an existing fact',
  },

  [FactActions.DELETE]: {
    action: FactActions.DELETE,
    service: 'archivist',
    requestSchema: FactDeleteRequestSchema,
    responseSchema: FactDeleteResponseSchema,
    description: 'Delete a fact from the knowledge graph',
  },

  [FactActions.GET]: {
    action: FactActions.GET,
    service: 'archivist',
    requestSchema: FactGetRequestSchema,
    responseSchema: FactGetResponseSchema,
    description: 'Get facts about a specific kind/entity',
  },

  [FactActions.GET_SUBTYPES]: {
    action: FactActions.GET_SUBTYPES,
    service: 'archivist',
    requestSchema: FactGetSubtypesRequestSchema,
    responseSchema: FactGetSubtypesResponseSchema,
    description: 'Get subtypes of a specific kind',
  },

  [FactActions.GET_SUPERTYPES]: {
    action: FactActions.GET_SUPERTYPES,
    service: 'archivist',
    requestSchema: FactGetSupertypesRequestSchema,
    responseSchema: FactGetSupertypesResponseSchema,
    description: 'Get supertypes of a specific kind',
  },

  [FactActions.GET_CLASSIFIED]: {
    action: FactActions.GET_CLASSIFIED,
    service: 'archivist',
    requestSchema: FactGetClassifiedRequestSchema,
    responseSchema: FactGetClassifiedResponseSchema,
    description: 'Get classified facts for a specific entity',
  },

  [FactActions.VALIDATE]: {
    action: FactActions.VALIDATE,
    service: 'archivist',
    requestSchema: FactValidateRequestSchema,
    responseSchema: FactValidateResponseSchema,
    description: 'Validate a fact before creation',
  },

  [FactActions.BATCH_GET]: {
    action: FactActions.BATCH_GET,
    service: 'archivist',
    requestSchema: FactBatchGetRequestSchema,
    responseSchema: FactBatchGetResponseSchema,
    description: 'Batch retrieval of facts for cache building operations',
  },

  [FactActions.COUNT]: {
    action: FactActions.COUNT,
    service: 'archivist',
    requestSchema: FactCountRequestSchema,
    responseSchema: FactCountResponseSchema,
    description: 'Get total count of facts for progress tracking',
  },

  // Search contracts
  [SearchActions.GENERAL]: {
    action: SearchActions.GENERAL,
    service: 'archivist',
    requestSchema: SearchGeneralRequestSchema,
    responseSchema: SearchGeneralResponseSchema,
    description: 'Perform general text search across all entities',
  },

  [SearchActions.INDIVIDUAL]: {
    action: SearchActions.INDIVIDUAL,
    service: 'archivist',
    requestSchema: SearchIndividualRequestSchema,
    responseSchema: SearchIndividualResponseSchema,
    description: 'Search for individual entities',
  },

  [SearchActions.KIND]: {
    action: SearchActions.KIND,
    service: 'archivist',
    requestSchema: SearchKindRequestSchema,
    responseSchema: SearchKindResponseSchema,
    description: 'Search for kinds/types',
  },

  [SearchActions.EXECUTE]: {
    action: SearchActions.EXECUTE,
    service: 'archivist',
    requestSchema: SearchExecuteRequestSchema,
    responseSchema: SearchExecuteResponseSchema,
    description: 'Execute a complex search query',
  },

  [SearchActions.UID]: {
    action: SearchActions.UID,
    service: 'archivist',
    requestSchema: SearchUidRequestSchema,
    responseSchema: SearchUidResponseSchema,
    description: 'Search by specific UID',
  },

  // Concept contracts
  [ConceptActions.GET]: {
    action: ConceptActions.GET,
    service: 'archivist',
    requestSchema: ConceptGetRequestSchema,
    responseSchema: ConceptGetResponseSchema,
    description: 'Get a concept by UID',
  },

  [ConceptActions.CREATE]: {
    action: ConceptActions.CREATE,
    service: 'archivist',
    requestSchema: ConceptCreateRequestSchema,
    responseSchema: ConceptCreateResponseSchema,
    description: 'Create a new concept',
  },

  [ConceptActions.UPDATE]: {
    action: ConceptActions.UPDATE,
    service: 'archivist',
    requestSchema: ConceptUpdateRequestSchema,
    responseSchema: ConceptUpdateResponseSchema,
    description: 'Update an existing concept',
  },

  [ConceptActions.DELETE]: {
    action: ConceptActions.DELETE,
    service: 'archivist',
    requestSchema: ConceptDeleteRequestSchema,
    responseSchema: ConceptDeleteResponseSchema,
    description: 'Delete a concept',
  },

  // Query contracts
  [QueryActions.EXECUTE]: {
    action: QueryActions.EXECUTE,
    service: 'archivist',
    requestSchema: QueryExecuteRequestSchema,
    responseSchema: QueryExecuteResponseSchema,
    description: 'Execute a database query',
  },

  [QueryActions.VALIDATE]: {
    action: QueryActions.VALIDATE,
    service: 'archivist',
    requestSchema: QueryValidateRequestSchema,
    responseSchema: QueryValidateResponseSchema,
    description: 'Validate a query before execution',
  },

  [QueryActions.PARSE]: {
    action: QueryActions.PARSE,
    service: 'archivist',
    requestSchema: QueryParseRequestSchema,
    responseSchema: QueryParseResponseSchema,
    description: 'Parse a query string',
  },

  // Kind contracts
  [KindActions.GET]: {
    action: KindActions.GET,
    service: 'archivist',
    requestSchema: KindGetRequestSchema,
    responseSchema: KindGetResponseSchema,
    description: 'Get a specific kind by UID',
  },

  [KindActions.LIST]: {
    action: KindActions.LIST,
    service: 'archivist',
    requestSchema: KindsListRequestSchema,
    responseSchema: KindsListResponseSchema,
    description: 'List all kinds with pagination',
  },

  [KindActions.SEARCH]: {
    action: KindActions.SEARCH,
    service: 'archivist',
    requestSchema: KindsSearchRequestSchema,
    responseSchema: KindsSearchResponseSchema,
    description: 'Search for kinds by query',
  },

  // UID contracts
  [UIDActions.GENERATE]: {
    action: UIDActions.GENERATE,
    service: 'archivist',
    requestSchema: UIDGenerateRequestSchema,
    responseSchema: UIDGenerateResponseSchema,
    description: 'Generate a single unique identifier',
  },

  [UIDActions.BATCH]: {
    action: UIDActions.BATCH,
    service: 'archivist',
    requestSchema: UIDBatchRequestSchema,
    responseSchema: UIDBatchResponseSchema,
    description: 'Generate multiple unique identifiers',
  },

  [UIDActions.RESERVE]: {
    action: UIDActions.RESERVE,
    service: 'archivist',
    requestSchema: UIDReserveRequestSchema,
    responseSchema: UIDReserveResponseSchema,
    description: 'Reserve a range of unique identifiers',
  },

  // Completion contracts
  [CompletionActions.REQUEST]: {
    action: CompletionActions.REQUEST,
    service: 'archivist',
    requestSchema: CompletionRequestSchema,
    responseSchema: CompletionResponseSchema,
    description: 'Get text completion suggestions',
  },

  [CompletionActions.ENTITIES]: {
    action: CompletionActions.ENTITIES,
    service: 'archivist',
    requestSchema: CompletionEntitiesRequestSchema,
    responseSchema: CompletionEntitiesResponseSchema,
    description: 'Get entity completion suggestions',
  },

  [CompletionActions.RELATIONS]: {
    action: CompletionActions.RELATIONS,
    service: 'archivist',
    requestSchema: CompletionRelationsRequestSchema,
    responseSchema: CompletionRelationsResponseSchema,
    description: 'Get relation completion suggestions',
  },

  // Definition contracts
  [DefinitionActions.GET]: {
    action: DefinitionActions.GET,
    service: 'archivist',
    requestSchema: DefinitionGetRequestSchema,
    responseSchema: DefinitionGetResponseSchema,
    description: 'Get definition for an entity',
  },

  [DefinitionActions.UPDATE]: {
    action: DefinitionActions.UPDATE,
    service: 'archivist',
    requestSchema: DefinitionUpdateRequestSchema,
    responseSchema: DefinitionUpdateResponseSchema,
    description: 'Update definition for an entity',
  },

  // Submission contracts
  [SubmissionActions.SUBMIT]: {
    action: SubmissionActions.SUBMIT,
    service: 'archivist',
    requestSchema: SubmissionSubmitRequestSchema,
    responseSchema: SubmissionSubmitResponseSchema,
    description: 'Submit facts to the knowledge graph',
  },

  [SubmissionActions.BATCH]: {
    action: SubmissionActions.BATCH,
    service: 'archivist',
    requestSchema: SubmissionBatchRequestSchema,
    responseSchema: SubmissionBatchResponseSchema,
    description: 'Submit multiple facts in batch',
  },

  // Transaction contracts
  [TransactionActions.START]: {
    action: TransactionActions.START,
    service: 'archivist',
    requestSchema: TransactionStartRequestSchema,
    responseSchema: TransactionStartResponseSchema,
    description: 'Start a new transaction',
  },

  [TransactionActions.COMMIT]: {
    action: TransactionActions.COMMIT,
    service: 'archivist',
    requestSchema: TransactionCommitRequestSchema,
    responseSchema: TransactionCommitResponseSchema,
    description: 'Commit a transaction',
  },

  [TransactionActions.ROLLBACK]: {
    action: TransactionActions.ROLLBACK,
    service: 'archivist',
    requestSchema: TransactionRollbackRequestSchema,
    responseSchema: TransactionRollbackResponseSchema,
    description: 'Rollback a transaction',
  },

  [TransactionActions.GET]: {
    action: TransactionActions.GET,
    service: 'archivist',
    requestSchema: TransactionGetRequestSchema,
    responseSchema: TransactionGetResponseSchema,
    description: 'Get transaction status',
  },

  // Validation contracts
  [ValidationActions.VALIDATE]: {
    action: ValidationActions.VALIDATE,
    service: 'archivist',
    requestSchema: ValidationValidateRequestSchema,
    responseSchema: ValidationValidateResponseSchema,
    description: 'Validate a single fact',
  },

  [ValidationActions.COLLECTION]: {
    action: ValidationActions.COLLECTION,
    service: 'archivist',
    requestSchema: ValidationCollectionRequestSchema,
    responseSchema: ValidationCollectionResponseSchema,
    description: 'Validate a collection of facts',
  },

  // Lineage contracts
  [LineageActions.GET]: {
    action: LineageActions.GET,
    service: 'archivist',
    requestSchema: LineageGetRequestSchema,
    responseSchema: LineageGetResponseSchema,
    description: 'Calculate entity lineage using C3 linearization algorithm',
  },

  // Entity contracts
  [EntityActions.BATCH_RESOLVE]: {
    action: EntityActions.BATCH_RESOLVE,
    service: 'archivist',
    requestSchema: EntityBatchResolveRequestSchema,
    responseSchema: EntityBatchResolveResponseSchema,
    description: 'Batch resolve multiple entity UIDs to their data',
  },

  [EntityActions.CATEGORY_GET]: {
    action: EntityActions.CATEGORY_GET,
    service: 'archivist',
    requestSchema: EntityCategoryGetRequestSchema,
    responseSchema: EntityCategoryGetResponseSchema,
    description: 'Get the category of an entity',
  },

  [EntityActions.TYPE_GET]: {
    action: EntityActions.TYPE_GET,
    service: 'archivist',
    requestSchema: EntityTypeGetRequestSchema,
    responseSchema: EntityTypeGetResponseSchema,
    description: 'Get the type of an entity',
  },

  [EntityActions.COLLECTIONS_GET]: {
    action: EntityActions.COLLECTIONS_GET,
    service: 'archivist',
    requestSchema: EntityCollectionsGetRequestSchema,
    responseSchema: EntityCollectionsGetResponseSchema,
    description: 'Get all available entity collections',
  },

  // =====================================================
  // APERTURE SERVICE CONTRACTS
  // =====================================================
  
  // Environment contracts
  [ApertureActions.ENVIRONMENT_GET]: {
    action: ApertureActions.ENVIRONMENT_GET,
    service: 'aperture',
    requestSchema: z.object({
      service: z.literal('aperture'),
      action: z.literal(ApertureActions.ENVIRONMENT_GET),
      payload: EnvironmentGetRequestSchema.optional(),
    }),
    responseSchema: ApertureResponseSchema,
    description: 'Get a user environment by ID or default',
  },

  [ApertureActions.ENVIRONMENT_LIST]: {
    action: ApertureActions.ENVIRONMENT_LIST,
    service: 'aperture',
    requestSchema: EnvironmentListRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'List all environments for a user',
  },

  [ApertureActions.ENVIRONMENT_CREATE]: {
    action: ApertureActions.ENVIRONMENT_CREATE,
    service: 'aperture',
    requestSchema: EnvironmentCreateRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Create a new environment for a user',
  },

  [ApertureActions.ENVIRONMENT_CLEAR]: {
    action: ApertureActions.ENVIRONMENT_CLEAR,
    service: 'aperture',
    requestSchema: EnvironmentClearRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Clear all facts from an environment',
  },

  // Search contracts
  [ApertureActions.SEARCH_LOAD_TEXT]: {
    action: ApertureActions.SEARCH_LOAD_TEXT,
    service: 'aperture',
    requestSchema: SearchLoadTextRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load facts into environment based on text search',
  },

  [ApertureActions.SEARCH_LOAD_UID]: {
    action: ApertureActions.SEARCH_LOAD_UID,
    service: 'aperture',
    requestSchema: SearchLoadUidRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load facts into environment based on UID search',
  },

  // Specialization contracts
  [ApertureActions.SPECIALIZATION_LOAD_FACT]: {
    action: ApertureActions.SPECIALIZATION_LOAD_FACT,
    service: 'aperture',
    requestSchema: SpecializationLoadFactRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load specialization fact for an entity',
  },

  [ApertureActions.SPECIALIZATION_LOAD]: {
    action: ApertureActions.SPECIALIZATION_LOAD,
    service: 'aperture',
    requestSchema: SpecializationLoadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load specialization hierarchy for an entity',
  },

  // Entity contracts
  [ApertureActions.ENTITY_LOAD]: {
    action: ApertureActions.ENTITY_LOAD,
    service: 'aperture',
    requestSchema: EntityLoadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load an entity and its facts into environment',
  },

  [ApertureActions.ENTITY_UNLOAD]: {
    action: ApertureActions.ENTITY_UNLOAD,
    service: 'aperture',
    requestSchema: EntityUnloadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Unload an entity and its facts from environment',
  },

  [ApertureActions.SELECT_ENTITY]: {
    action: ApertureActions.SELECT_ENTITY,
    service: 'aperture',
    requestSchema: EntitySelectRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Select an entity in the environment',
  },

  [ApertureActions.ENTITY_DESELECT]: {
    action: ApertureActions.ENTITY_DESELECT,
    service: 'aperture',
    requestSchema: EntityDeselectRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Deselect the current entity in environment',
  },

  [ApertureActions.ENTITY_LOAD_MULTIPLE]: {
    action: ApertureActions.ENTITY_LOAD_MULTIPLE,
    service: 'aperture',
    requestSchema: EntityLoadMultipleRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load multiple entities and their facts into environment',
  },

  [ApertureActions.ENTITY_UNLOAD_MULTIPLE]: {
    action: ApertureActions.ENTITY_UNLOAD_MULTIPLE,
    service: 'aperture',
    requestSchema: EntityUnloadMultipleRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Unload multiple entities and their facts from environment',
  },

  // Subtype contracts
  [ApertureActions.SUBTYPE_LOAD]: {
    action: ApertureActions.SUBTYPE_LOAD,
    service: 'aperture',
    requestSchema: SubtypeLoadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load subtype facts for an entity',
  },

  [ApertureActions.SUBTYPE_LOAD_CONE]: {
    action: ApertureActions.SUBTYPE_LOAD_CONE,
    service: 'aperture',
    requestSchema: SubtypeLoadConeRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load complete subtype hierarchy cone for an entity',
  },

  [ApertureActions.SUBTYPE_UNLOAD_CONE]: {
    action: ApertureActions.SUBTYPE_UNLOAD_CONE,
    service: 'aperture',
    requestSchema: SubtypeUnloadConeRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Unload complete subtype hierarchy cone for an entity',
  },

  // Classification contracts
  [ApertureActions.CLASSIFICATION_LOAD]: {
    action: ApertureActions.CLASSIFICATION_LOAD,
    service: 'aperture',
    requestSchema: ClassificationLoadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load classification facts for an entity',
  },

  [ApertureActions.CLASSIFICATION_LOAD_FACT]: {
    action: ApertureActions.CLASSIFICATION_LOAD_FACT,
    service: 'aperture',
    requestSchema: ClassificationLoadFactRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load classification fact for an entity',
  },

  // Composition contracts
  [ApertureActions.COMPOSITION_LOAD]: {
    action: ApertureActions.COMPOSITION_LOAD,
    service: 'aperture',
    requestSchema: CompositionLoadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load composition relationships for an entity',
  },

  [ApertureActions.COMPOSITION_LOAD_IN]: {
    action: ApertureActions.COMPOSITION_LOAD_IN,
    service: 'aperture',
    requestSchema: CompositionLoadInRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load incoming composition relationships for an entity',
  },

  // Connection contracts
  [ApertureActions.CONNECTION_LOAD]: {
    action: ApertureActions.CONNECTION_LOAD,
    service: 'aperture',
    requestSchema: ConnectionLoadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load connection relationships for an entity',
  },

  [ApertureActions.CONNECTION_LOAD_IN]: {
    action: ApertureActions.CONNECTION_LOAD_IN,
    service: 'aperture',
    requestSchema: ConnectionLoadInRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load incoming connection relationships for an entity',
  },

  // Relation contracts
  [ApertureActions.RELATION_REQUIRED_ROLES_LOAD]: {
    action: ApertureActions.RELATION_REQUIRED_ROLES_LOAD,
    service: 'aperture',
    requestSchema: RelationRequiredRolesLoadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load required roles for a relation type',
  },

  [ApertureActions.RELATION_ROLE_PLAYERS_LOAD]: {
    action: ApertureActions.RELATION_ROLE_PLAYERS_LOAD,
    service: 'aperture',
    requestSchema: RelationRolePlayersLoadRequestSchema,
    responseSchema: ApertureResponseSchema,
    description: 'Load role players for a relation type',
  },

  // =====================================================
  // CLARITY SERVICE CONTRACTS
  // =====================================================

  [ClarityActions.MODEL_GET]: {
    action: ClarityActions.MODEL_GET,
    service: 'clarity',
    requestSchema: z.object({
      service: z.literal('clarity'),
      action: z.literal(ClarityActions.MODEL_GET),
      payload: z.object({
        uid: z.string().optional(),
      }).optional(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        model: z.any(),
      }).optional(),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      }).optional(),
    }),
    description: 'Get a semantic model by ID',
  },

  [ClarityActions.MODEL_GET_BATCH]: {
    action: ClarityActions.MODEL_GET_BATCH,
    service: 'clarity',
    requestSchema: z.object({
      service: z.literal('clarity'),
      action: z.literal(ClarityActions.MODEL_GET_BATCH),
      payload: z.object({
        uids: z.array(z.string()),
      }),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        models: z.array(z.any()),
      }).optional(),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      }).optional(),
    }),
    description: 'Get multiple semantic models',
  },

  [ClarityActions.MODEL_CREATE]: {
    action: ClarityActions.MODEL_CREATE,
    service: 'clarity',
    requestSchema: z.object({
      service: z.literal('clarity'),
      action: z.literal(ClarityActions.MODEL_CREATE),
      payload: z.object({
        name: z.string(),
        type: z.string(),
        data: z.any(),
      }),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        model: z.any(),
      }).optional(),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      }).optional(),
    }),
    description: 'Create a new semantic model',
  },

  [ClarityActions.MODEL_UPDATE]: {
    action: ClarityActions.MODEL_UPDATE,
    service: 'clarity',
    requestSchema: z.object({
      service: z.literal('clarity'),
      action: z.literal(ClarityActions.MODEL_UPDATE),
      payload: z.object({
        modelId: z.string(),
        name: z.string().optional(),
        type: z.string().optional(),
        data: z.any().optional(),
      }),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        model: z.any(),
      }).optional(),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      }).optional(),
    }),
    description: 'Update an existing semantic model',
  },

  [ClarityActions.KIND_GET]: {
    action: ClarityActions.KIND_GET,
    service: 'clarity',
    requestSchema: z.object({
      service: z.literal('clarity'),
      action: z.literal(ClarityActions.KIND_GET),
      payload: z.object({
        uid: z.string(),
      }),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        model: z.any(),
      }).optional(),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      }).optional(),
    }),
    description: 'Get a kind model by ID',
  },

  [ClarityActions.INDIVIDUAL_GET]: {
    action: ClarityActions.INDIVIDUAL_GET,
    service: 'clarity',
    requestSchema: z.object({
      service: z.literal('clarity'),
      action: z.literal(ClarityActions.INDIVIDUAL_GET),
      payload: z.object({
        uid: z.string(),
      }),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        model: z.any(),
      }).optional(),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      }).optional(),
    }),
    description: 'Get an individual model by ID',
  },

  [ClarityActions.ENVIRONMENT_GET]: {
    action: ClarityActions.ENVIRONMENT_GET,
    service: 'clarity',
    requestSchema: z.object({
      service: z.literal('clarity'),
      action: z.literal(ClarityActions.ENVIRONMENT_GET),
      payload: z.object({
        environmentId: z.string(),
      }),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      data: z.object({
        environment: z.any(),
      }).optional(),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      }).optional(),
    }),
    description: 'Get environment information from Clarity',
  },
  
} as const satisfies Record<string, MessageContract>;

/**
 * Simplified utility functions
 */
export const MessageRegistryUtils = {
  /**
   * Get contract by action (mainly for validation)
   */
  getContract(action: string): MessageContract | undefined {
    return MESSAGE_REGISTRY[action as keyof typeof MESSAGE_REGISTRY];
  },

  /**
   * Validate request message against contract
   */
  validateRequest(action: string, message: unknown): { success: true; data: any } | { success: false; error: string } {
    try {
      const contract = MESSAGE_REGISTRY[action as keyof typeof MESSAGE_REGISTRY];
      if (!contract) {
        return { success: false, error: `Unknown action: ${action}` };
      }
      const result = contract.requestSchema.parse(message);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    }
  },

  /**
   * Validate response message against contract
   */
  validateResponse(action: string, message: unknown): { success: true; data: any } | { success: false; error: string } {
    try {
      const contract = MESSAGE_REGISTRY[action as keyof typeof MESSAGE_REGISTRY];
      if (!contract) {
        return { success: false, error: `Unknown action: ${action}` };
      }
      const result = contract.responseSchema.parse(message);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    }
  },

  /**
   * Get all contracts for a specific service
   */
  getServiceContracts(serviceName: string): MessageContract[] {
    return Object.values(MESSAGE_REGISTRY).filter(
      contract => contract.service === serviceName
    );
  },
};
