import { z } from 'zod';
import { PrismActions } from './services/prism';
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
  // Request schemas
  FactCreateRequestSchema,
  FactUpdateRequestSchema,
  FactDeleteRequestSchema,
  FactGetRequestSchema,
  FactGetSubtypesRequestSchema,
  FactGetSupertypesRequestSchema,
  FactGetClassifiedRequestSchema,
  FactValidateRequestSchema,
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
  // Response schemas
  FactCreateResponseSchema,
  FactUpdateResponseSchema,
  FactDeleteResponseSchema,
  FactGetResponseSchema,
  FactGetSubtypesResponseSchema,
  FactGetSupertypesResponseSchema,
  FactGetClassifiedResponseSchema,
  FactValidateResponseSchema,
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
} from './services/archivist';

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