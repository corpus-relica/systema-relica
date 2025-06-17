"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRegistryUtils = exports.MESSAGE_REGISTRY = void 0;
const zod_1 = require("zod");
const prism_1 = require("./services/prism");
const archivist_1 = require("./services/archivist");
const aperture_1 = require("./services/aperture");
/**
 * Simplified registry for development validation only
 * Actions are now the actual topics - no mapping needed
 */
exports.MESSAGE_REGISTRY = {
    // =====================================================
    // PRISM SERVICE CONTRACTS
    // =====================================================
    [prism_1.PrismActions.GET_SETUP_STATUS]: {
        action: prism_1.PrismActions.GET_SETUP_STATUS, // 'setup/get-status'
        service: 'prism',
        requestSchema: zod_1.z.object({
            service: zod_1.z.literal('prism'),
            action: zod_1.z.literal(prism_1.PrismActions.GET_SETUP_STATUS),
        }),
        responseSchema: zod_1.z.object({
            success: zod_1.z.boolean(),
            data: zod_1.z.object({
                status: zod_1.z.string(),
                stage: zod_1.z.string().nullable(),
                message: zod_1.z.string(),
                progress: zod_1.z.number(),
                error: zod_1.z.string().optional(),
                timestamp: zod_1.z.string(),
            }).optional(),
        }),
        description: 'Get current setup status from Prism service',
    },
    [prism_1.PrismActions.RESET_SYSTEM]: {
        action: prism_1.PrismActions.RESET_SYSTEM, // 'setup/reset-system'
        service: 'prism',
        requestSchema: zod_1.z.object({
            service: zod_1.z.literal('prism'),
            action: zod_1.z.literal(prism_1.PrismActions.RESET_SYSTEM),
        }),
        responseSchema: zod_1.z.object({
            success: zod_1.z.boolean(),
            message: zod_1.z.string().optional(),
            errors: zod_1.z.array(zod_1.z.string()).optional(),
            timestamp: zod_1.z.string().optional(),
        }),
        description: 'Reset system state (clear databases)',
    },
    [prism_1.PrismActions.START_SETUP]: {
        action: prism_1.PrismActions.START_SETUP, // 'setup/start'
        service: 'prism',
        requestSchema: zod_1.z.object({
            service: zod_1.z.literal('prism'),
            action: zod_1.z.literal(prism_1.PrismActions.START_SETUP),
        }),
        responseSchema: zod_1.z.object({
            success: zod_1.z.boolean(),
            message: zod_1.z.string().optional(),
        }),
        description: 'Start the setup process',
    },
    [prism_1.PrismActions.CREATE_USER]: {
        action: prism_1.PrismActions.CREATE_USER, // 'setup/create-user'
        service: 'prism',
        requestSchema: zod_1.z.object({
            service: zod_1.z.literal('prism'),
            action: zod_1.z.literal(prism_1.PrismActions.CREATE_USER),
            payload: zod_1.z.object({
                username: zod_1.z.string(),
                password: zod_1.z.string(),
                confirmPassword: zod_1.z.string(),
            }),
        }),
        responseSchema: zod_1.z.object({
            success: zod_1.z.boolean(),
            data: zod_1.z.object({
                message: zod_1.z.string(),
                user: zod_1.z.object({
                    username: zod_1.z.string(),
                    role: zod_1.z.string(),
                }),
            }).optional(),
            error: zod_1.z.object({
                code: zod_1.z.string(),
                type: zod_1.z.string(),
                message: zod_1.z.string(),
            }).optional(),
        }),
        description: 'Create admin user during setup',
    },
    // =====================================================
    // ARCHIVIST SERVICE CONTRACTS
    // =====================================================
    // Fact contracts
    [archivist_1.FactActions.CREATE]: {
        action: archivist_1.FactActions.CREATE,
        service: 'archivist',
        requestSchema: archivist_1.FactCreateRequestSchema,
        responseSchema: archivist_1.FactCreateResponseSchema,
        description: 'Create a new fact in the knowledge graph',
    },
    [archivist_1.FactActions.UPDATE]: {
        action: archivist_1.FactActions.UPDATE,
        service: 'archivist',
        requestSchema: archivist_1.FactUpdateRequestSchema,
        responseSchema: archivist_1.FactUpdateResponseSchema,
        description: 'Update an existing fact',
    },
    [archivist_1.FactActions.DELETE]: {
        action: archivist_1.FactActions.DELETE,
        service: 'archivist',
        requestSchema: archivist_1.FactDeleteRequestSchema,
        responseSchema: archivist_1.FactDeleteResponseSchema,
        description: 'Delete a fact from the knowledge graph',
    },
    [archivist_1.FactActions.GET]: {
        action: archivist_1.FactActions.GET,
        service: 'archivist',
        requestSchema: archivist_1.FactGetRequestSchema,
        responseSchema: archivist_1.FactGetResponseSchema,
        description: 'Get facts about a specific kind/entity',
    },
    [archivist_1.FactActions.GET_SUBTYPES]: {
        action: archivist_1.FactActions.GET_SUBTYPES,
        service: 'archivist',
        requestSchema: archivist_1.FactGetSubtypesRequestSchema,
        responseSchema: archivist_1.FactGetSubtypesResponseSchema,
        description: 'Get subtypes of a specific kind',
    },
    [archivist_1.FactActions.GET_SUPERTYPES]: {
        action: archivist_1.FactActions.GET_SUPERTYPES,
        service: 'archivist',
        requestSchema: archivist_1.FactGetSupertypesRequestSchema,
        responseSchema: archivist_1.FactGetSupertypesResponseSchema,
        description: 'Get supertypes of a specific kind',
    },
    [archivist_1.FactActions.GET_CLASSIFIED]: {
        action: archivist_1.FactActions.GET_CLASSIFIED,
        service: 'archivist',
        requestSchema: archivist_1.FactGetClassifiedRequestSchema,
        responseSchema: archivist_1.FactGetClassifiedResponseSchema,
        description: 'Get classified facts for a specific entity',
    },
    [archivist_1.FactActions.VALIDATE]: {
        action: archivist_1.FactActions.VALIDATE,
        service: 'archivist',
        requestSchema: archivist_1.FactValidateRequestSchema,
        responseSchema: archivist_1.FactValidateResponseSchema,
        description: 'Validate a fact before creation',
    },
    // Search contracts
    [archivist_1.SearchActions.GENERAL]: {
        action: archivist_1.SearchActions.GENERAL,
        service: 'archivist',
        requestSchema: archivist_1.SearchGeneralRequestSchema,
        responseSchema: archivist_1.SearchGeneralResponseSchema,
        description: 'Perform general text search across all entities',
    },
    [archivist_1.SearchActions.INDIVIDUAL]: {
        action: archivist_1.SearchActions.INDIVIDUAL,
        service: 'archivist',
        requestSchema: archivist_1.SearchIndividualRequestSchema,
        responseSchema: archivist_1.SearchIndividualResponseSchema,
        description: 'Search for individual entities',
    },
    [archivist_1.SearchActions.KIND]: {
        action: archivist_1.SearchActions.KIND,
        service: 'archivist',
        requestSchema: archivist_1.SearchKindRequestSchema,
        responseSchema: archivist_1.SearchKindResponseSchema,
        description: 'Search for kinds/types',
    },
    [archivist_1.SearchActions.EXECUTE]: {
        action: archivist_1.SearchActions.EXECUTE,
        service: 'archivist',
        requestSchema: archivist_1.SearchExecuteRequestSchema,
        responseSchema: archivist_1.SearchExecuteResponseSchema,
        description: 'Execute a complex search query',
    },
    [archivist_1.SearchActions.UID]: {
        action: archivist_1.SearchActions.UID,
        service: 'archivist',
        requestSchema: archivist_1.SearchUidRequestSchema,
        responseSchema: archivist_1.SearchUidResponseSchema,
        description: 'Search by specific UID',
    },
    // Concept contracts
    [archivist_1.ConceptActions.GET]: {
        action: archivist_1.ConceptActions.GET,
        service: 'archivist',
        requestSchema: archivist_1.ConceptGetRequestSchema,
        responseSchema: archivist_1.ConceptGetResponseSchema,
        description: 'Get a concept by UID',
    },
    [archivist_1.ConceptActions.CREATE]: {
        action: archivist_1.ConceptActions.CREATE,
        service: 'archivist',
        requestSchema: archivist_1.ConceptCreateRequestSchema,
        responseSchema: archivist_1.ConceptCreateResponseSchema,
        description: 'Create a new concept',
    },
    [archivist_1.ConceptActions.UPDATE]: {
        action: archivist_1.ConceptActions.UPDATE,
        service: 'archivist',
        requestSchema: archivist_1.ConceptUpdateRequestSchema,
        responseSchema: archivist_1.ConceptUpdateResponseSchema,
        description: 'Update an existing concept',
    },
    [archivist_1.ConceptActions.DELETE]: {
        action: archivist_1.ConceptActions.DELETE,
        service: 'archivist',
        requestSchema: archivist_1.ConceptDeleteRequestSchema,
        responseSchema: archivist_1.ConceptDeleteResponseSchema,
        description: 'Delete a concept',
    },
    // Query contracts
    [archivist_1.QueryActions.EXECUTE]: {
        action: archivist_1.QueryActions.EXECUTE,
        service: 'archivist',
        requestSchema: archivist_1.QueryExecuteRequestSchema,
        responseSchema: archivist_1.QueryExecuteResponseSchema,
        description: 'Execute a database query',
    },
    [archivist_1.QueryActions.VALIDATE]: {
        action: archivist_1.QueryActions.VALIDATE,
        service: 'archivist',
        requestSchema: archivist_1.QueryValidateRequestSchema,
        responseSchema: archivist_1.QueryValidateResponseSchema,
        description: 'Validate a query before execution',
    },
    [archivist_1.QueryActions.PARSE]: {
        action: archivist_1.QueryActions.PARSE,
        service: 'archivist',
        requestSchema: archivist_1.QueryParseRequestSchema,
        responseSchema: archivist_1.QueryParseResponseSchema,
        description: 'Parse a query string',
    },
    // Kind contracts
    [archivist_1.KindActions.GET]: {
        action: archivist_1.KindActions.GET,
        service: 'archivist',
        requestSchema: archivist_1.KindGetRequestSchema,
        responseSchema: archivist_1.KindGetResponseSchema,
        description: 'Get a specific kind by UID',
    },
    [archivist_1.KindActions.LIST]: {
        action: archivist_1.KindActions.LIST,
        service: 'archivist',
        requestSchema: archivist_1.KindsListRequestSchema,
        responseSchema: archivist_1.KindsListResponseSchema,
        description: 'List all kinds with pagination',
    },
    [archivist_1.KindActions.SEARCH]: {
        action: archivist_1.KindActions.SEARCH,
        service: 'archivist',
        requestSchema: archivist_1.KindsSearchRequestSchema,
        responseSchema: archivist_1.KindsSearchResponseSchema,
        description: 'Search for kinds by query',
    },
    // UID contracts
    [archivist_1.UIDActions.GENERATE]: {
        action: archivist_1.UIDActions.GENERATE,
        service: 'archivist',
        requestSchema: archivist_1.UIDGenerateRequestSchema,
        responseSchema: archivist_1.UIDGenerateResponseSchema,
        description: 'Generate a single unique identifier',
    },
    [archivist_1.UIDActions.BATCH]: {
        action: archivist_1.UIDActions.BATCH,
        service: 'archivist',
        requestSchema: archivist_1.UIDBatchRequestSchema,
        responseSchema: archivist_1.UIDBatchResponseSchema,
        description: 'Generate multiple unique identifiers',
    },
    [archivist_1.UIDActions.RESERVE]: {
        action: archivist_1.UIDActions.RESERVE,
        service: 'archivist',
        requestSchema: archivist_1.UIDReserveRequestSchema,
        responseSchema: archivist_1.UIDReserveResponseSchema,
        description: 'Reserve a range of unique identifiers',
    },
    // Completion contracts
    [archivist_1.CompletionActions.REQUEST]: {
        action: archivist_1.CompletionActions.REQUEST,
        service: 'archivist',
        requestSchema: archivist_1.CompletionRequestSchema,
        responseSchema: archivist_1.CompletionResponseSchema,
        description: 'Get text completion suggestions',
    },
    [archivist_1.CompletionActions.ENTITIES]: {
        action: archivist_1.CompletionActions.ENTITIES,
        service: 'archivist',
        requestSchema: archivist_1.CompletionEntitiesRequestSchema,
        responseSchema: archivist_1.CompletionEntitiesResponseSchema,
        description: 'Get entity completion suggestions',
    },
    [archivist_1.CompletionActions.RELATIONS]: {
        action: archivist_1.CompletionActions.RELATIONS,
        service: 'archivist',
        requestSchema: archivist_1.CompletionRelationsRequestSchema,
        responseSchema: archivist_1.CompletionRelationsResponseSchema,
        description: 'Get relation completion suggestions',
    },
    // Definition contracts
    [archivist_1.DefinitionActions.GET]: {
        action: archivist_1.DefinitionActions.GET,
        service: 'archivist',
        requestSchema: archivist_1.DefinitionGetRequestSchema,
        responseSchema: archivist_1.DefinitionGetResponseSchema,
        description: 'Get definition for an entity',
    },
    [archivist_1.DefinitionActions.UPDATE]: {
        action: archivist_1.DefinitionActions.UPDATE,
        service: 'archivist',
        requestSchema: archivist_1.DefinitionUpdateRequestSchema,
        responseSchema: archivist_1.DefinitionUpdateResponseSchema,
        description: 'Update definition for an entity',
    },
    // Submission contracts
    [archivist_1.SubmissionActions.SUBMIT]: {
        action: archivist_1.SubmissionActions.SUBMIT,
        service: 'archivist',
        requestSchema: archivist_1.SubmissionSubmitRequestSchema,
        responseSchema: archivist_1.SubmissionSubmitResponseSchema,
        description: 'Submit facts to the knowledge graph',
    },
    [archivist_1.SubmissionActions.BATCH]: {
        action: archivist_1.SubmissionActions.BATCH,
        service: 'archivist',
        requestSchema: archivist_1.SubmissionBatchRequestSchema,
        responseSchema: archivist_1.SubmissionBatchResponseSchema,
        description: 'Submit multiple facts in batch',
    },
    // Transaction contracts
    [archivist_1.TransactionActions.START]: {
        action: archivist_1.TransactionActions.START,
        service: 'archivist',
        requestSchema: archivist_1.TransactionStartRequestSchema,
        responseSchema: archivist_1.TransactionStartResponseSchema,
        description: 'Start a new transaction',
    },
    [archivist_1.TransactionActions.COMMIT]: {
        action: archivist_1.TransactionActions.COMMIT,
        service: 'archivist',
        requestSchema: archivist_1.TransactionCommitRequestSchema,
        responseSchema: archivist_1.TransactionCommitResponseSchema,
        description: 'Commit a transaction',
    },
    [archivist_1.TransactionActions.ROLLBACK]: {
        action: archivist_1.TransactionActions.ROLLBACK,
        service: 'archivist',
        requestSchema: archivist_1.TransactionRollbackRequestSchema,
        responseSchema: archivist_1.TransactionRollbackResponseSchema,
        description: 'Rollback a transaction',
    },
    [archivist_1.TransactionActions.GET]: {
        action: archivist_1.TransactionActions.GET,
        service: 'archivist',
        requestSchema: archivist_1.TransactionGetRequestSchema,
        responseSchema: archivist_1.TransactionGetResponseSchema,
        description: 'Get transaction status',
    },
    // Validation contracts
    [archivist_1.ValidationActions.VALIDATE]: {
        action: archivist_1.ValidationActions.VALIDATE,
        service: 'archivist',
        requestSchema: archivist_1.ValidationValidateRequestSchema,
        responseSchema: archivist_1.ValidationValidateResponseSchema,
        description: 'Validate a single fact',
    },
    [archivist_1.ValidationActions.COLLECTION]: {
        action: archivist_1.ValidationActions.COLLECTION,
        service: 'archivist',
        requestSchema: archivist_1.ValidationCollectionRequestSchema,
        responseSchema: archivist_1.ValidationCollectionResponseSchema,
        description: 'Validate a collection of facts',
    },
    // =====================================================
    // APERTURE SERVICE CONTRACTS
    // =====================================================
    // Environment contracts
    [aperture_1.ApertureActions.ENVIRONMENT_GET]: {
        action: aperture_1.ApertureActions.ENVIRONMENT_GET,
        service: 'aperture',
        requestSchema: aperture_1.EnvironmentGetRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Get a user environment by ID or default',
    },
    [aperture_1.ApertureActions.ENVIRONMENT_LIST]: {
        action: aperture_1.ApertureActions.ENVIRONMENT_LIST,
        service: 'aperture',
        requestSchema: aperture_1.EnvironmentListRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'List all environments for a user',
    },
    [aperture_1.ApertureActions.ENVIRONMENT_CREATE]: {
        action: aperture_1.ApertureActions.ENVIRONMENT_CREATE,
        service: 'aperture',
        requestSchema: aperture_1.EnvironmentCreateRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Create a new environment for a user',
    },
    [aperture_1.ApertureActions.ENVIRONMENT_CLEAR]: {
        action: aperture_1.ApertureActions.ENVIRONMENT_CLEAR,
        service: 'aperture',
        requestSchema: aperture_1.EnvironmentClearRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Clear all facts from an environment',
    },
    // Search contracts
    [aperture_1.ApertureActions.SEARCH_LOAD_TEXT]: {
        action: aperture_1.ApertureActions.SEARCH_LOAD_TEXT,
        service: 'aperture',
        requestSchema: aperture_1.SearchLoadTextRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load facts into environment based on text search',
    },
    [aperture_1.ApertureActions.SEARCH_LOAD_UID]: {
        action: aperture_1.ApertureActions.SEARCH_LOAD_UID,
        service: 'aperture',
        requestSchema: aperture_1.SearchLoadUidRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load facts into environment based on UID search',
    },
    // Specialization contracts
    [aperture_1.ApertureActions.SPECIALIZATION_LOAD_FACT]: {
        action: aperture_1.ApertureActions.SPECIALIZATION_LOAD_FACT,
        service: 'aperture',
        requestSchema: aperture_1.SpecializationLoadFactRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load specialization fact for an entity',
    },
    [aperture_1.ApertureActions.SPECIALIZATION_LOAD]: {
        action: aperture_1.ApertureActions.SPECIALIZATION_LOAD,
        service: 'aperture',
        requestSchema: aperture_1.SpecializationLoadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load specialization hierarchy for an entity',
    },
    // Entity contracts
    [aperture_1.ApertureActions.ENTITY_LOAD]: {
        action: aperture_1.ApertureActions.ENTITY_LOAD,
        service: 'aperture',
        requestSchema: aperture_1.EntityLoadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load an entity and its facts into environment',
    },
    [aperture_1.ApertureActions.ENTITY_UNLOAD]: {
        action: aperture_1.ApertureActions.ENTITY_UNLOAD,
        service: 'aperture',
        requestSchema: aperture_1.EntityUnloadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Unload an entity and its facts from environment',
    },
    [aperture_1.ApertureActions.ENTITY_SELECT]: {
        action: aperture_1.ApertureActions.ENTITY_SELECT,
        service: 'aperture',
        requestSchema: aperture_1.EntitySelectRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Select an entity in the environment',
    },
    [aperture_1.ApertureActions.ENTITY_DESELECT]: {
        action: aperture_1.ApertureActions.ENTITY_DESELECT,
        service: 'aperture',
        requestSchema: aperture_1.EntityDeselectRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Deselect the current entity in environment',
    },
    [aperture_1.ApertureActions.ENTITY_LOAD_MULTIPLE]: {
        action: aperture_1.ApertureActions.ENTITY_LOAD_MULTIPLE,
        service: 'aperture',
        requestSchema: aperture_1.EntityLoadMultipleRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load multiple entities and their facts into environment',
    },
    [aperture_1.ApertureActions.ENTITY_UNLOAD_MULTIPLE]: {
        action: aperture_1.ApertureActions.ENTITY_UNLOAD_MULTIPLE,
        service: 'aperture',
        requestSchema: aperture_1.EntityUnloadMultipleRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Unload multiple entities and their facts from environment',
    },
    // Subtype contracts
    [aperture_1.ApertureActions.SUBTYPE_LOAD]: {
        action: aperture_1.ApertureActions.SUBTYPE_LOAD,
        service: 'aperture',
        requestSchema: aperture_1.SubtypeLoadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load subtype facts for an entity',
    },
    [aperture_1.ApertureActions.SUBTYPE_LOAD_CONE]: {
        action: aperture_1.ApertureActions.SUBTYPE_LOAD_CONE,
        service: 'aperture',
        requestSchema: aperture_1.SubtypeLoadConeRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load complete subtype hierarchy cone for an entity',
    },
    [aperture_1.ApertureActions.SUBTYPE_UNLOAD_CONE]: {
        action: aperture_1.ApertureActions.SUBTYPE_UNLOAD_CONE,
        service: 'aperture',
        requestSchema: aperture_1.SubtypeUnloadConeRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Unload complete subtype hierarchy cone for an entity',
    },
    // Classification contracts
    [aperture_1.ApertureActions.CLASSIFICATION_LOAD]: {
        action: aperture_1.ApertureActions.CLASSIFICATION_LOAD,
        service: 'aperture',
        requestSchema: aperture_1.ClassificationLoadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load classification facts for an entity',
    },
    [aperture_1.ApertureActions.CLASSIFICATION_LOAD_FACT]: {
        action: aperture_1.ApertureActions.CLASSIFICATION_LOAD_FACT,
        service: 'aperture',
        requestSchema: aperture_1.ClassificationLoadFactRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load classification fact for an entity',
    },
    // Composition contracts
    [aperture_1.ApertureActions.COMPOSITION_LOAD]: {
        action: aperture_1.ApertureActions.COMPOSITION_LOAD,
        service: 'aperture',
        requestSchema: aperture_1.CompositionLoadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load composition relationships for an entity',
    },
    [aperture_1.ApertureActions.COMPOSITION_LOAD_IN]: {
        action: aperture_1.ApertureActions.COMPOSITION_LOAD_IN,
        service: 'aperture',
        requestSchema: aperture_1.CompositionLoadInRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load incoming composition relationships for an entity',
    },
    // Connection contracts
    [aperture_1.ApertureActions.CONNECTION_LOAD]: {
        action: aperture_1.ApertureActions.CONNECTION_LOAD,
        service: 'aperture',
        requestSchema: aperture_1.ConnectionLoadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load connection relationships for an entity',
    },
    [aperture_1.ApertureActions.CONNECTION_LOAD_IN]: {
        action: aperture_1.ApertureActions.CONNECTION_LOAD_IN,
        service: 'aperture',
        requestSchema: aperture_1.ConnectionLoadInRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load incoming connection relationships for an entity',
    },
    // Relation contracts
    [aperture_1.ApertureActions.RELATION_REQUIRED_ROLES_LOAD]: {
        action: aperture_1.ApertureActions.RELATION_REQUIRED_ROLES_LOAD,
        service: 'aperture',
        requestSchema: aperture_1.RelationRequiredRolesLoadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load required roles for a relation type',
    },
    [aperture_1.ApertureActions.RELATION_ROLE_PLAYERS_LOAD]: {
        action: aperture_1.ApertureActions.RELATION_ROLE_PLAYERS_LOAD,
        service: 'aperture',
        requestSchema: aperture_1.RelationRolePlayersLoadRequestSchema,
        responseSchema: aperture_1.ApertureResponseSchema,
        description: 'Load role players for a relation type',
    },
};
/**
 * Simplified utility functions
 */
exports.MessageRegistryUtils = {
    /**
     * Get contract by action (mainly for validation)
     */
    getContract(action) {
        return exports.MESSAGE_REGISTRY[action];
    },
    /**
     * Validate request message against contract
     */
    validateRequest(action, message) {
        try {
            const contract = exports.MESSAGE_REGISTRY[action];
            if (!contract) {
                return { success: false, error: `Unknown action: ${action}` };
            }
            const result = contract.requestSchema.parse(message);
            return { success: true, data: result };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    },
    /**
     * Validate response message against contract
     */
    validateResponse(action, message) {
        try {
            const contract = exports.MESSAGE_REGISTRY[action];
            if (!contract) {
                return { success: false, error: `Unknown action: ${action}` };
            }
            const result = contract.responseSchema.parse(message);
            return { success: true, data: result };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    },
    /**
     * Get all contracts for a specific service
     */
    getServiceContracts(serviceName) {
        return Object.values(exports.MESSAGE_REGISTRY).filter(contract => contract.service === serviceName);
    },
};
//# sourceMappingURL=registry.js.map