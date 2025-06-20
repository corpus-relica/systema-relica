/**
 * @fileoverview WebSocket Contracts - Shared API contracts and types for Relica services
 * 
 * This package provides:
 * - Type-safe WebSocket message schemas
 * - Action → Topic mapping registry 
 * - Runtime validation utilities
 * - Development tools for contract alignment
 * 
 * @example
 * ```typescript
 * import { PrismActions, MessageRegistryUtils, ContractUtils } from '@relica/websocket-contracts';
 * 
 * // Use action directly as WebSocket topic
 * const topic = PrismActions.GET_SETUP_STATUS; // 'setup/get-status'
 * 
 * // Validate message against contract
 * const validation = ContractUtils.validate.request(PrismActions.GET_SETUP_STATUS, message);
 * if (validation.success) {
 *   // Message is valid
 * } else {
 *   console.error('Validation failed:', validation.error);
 * }
 * ```
 */

// Base message types
export * from './base';

// Service-specific contracts
export * from './services/prism';
export * from './services/archivist';
export * from './services/aperture';
export * from './services/clarity';
export * from './services/portal';

// Message registry and utilities
export * from './registry';

// Validation utilities
export * from './validation';

// Re-export commonly used items for convenience
export {
  ContractUtils,
  validator,
  devValidator,
  ContractValidator,
} from './validation';

export {
  PrismActions,
  PrismEvents,
  SetupStatusBroadcastEventSchema,
  type SetupStatusBroadcastEvent,
  type PrismEventType,
} from './services/prism';

export {
  // Fact operations
  FactActions,
  FactEvents,
  type FactActionType,
  type FactEventType,
  type FactCreateMessage,
  type FactUpdateMessage,
  type FactDeleteMessage,
  type FactQueryMessage,
  type FactCreateRequest,
  type FactCreateResponse,
  type FactGetRequest,
  type FactGetResponse,
  type FactDeleteRequest,
  type FactDeleteResponse,
  type FactBatchGetRequest,
  type FactBatchGetResponse,
  type FactBatchGetMessage,
  type FactCountRequest,
  type FactCountResponse,
  
  // Search operations
  SearchActions,
  SearchEvents,
  type SearchActionType,
  type SearchEventType,
  type SearchMessage,
  type SearchGeneralRequest,
  type SearchGeneralResponse,
  
  // Concept operations
  ConceptActions,
  ConceptEvents,
  type ConceptActionType,
  type ConceptEventType,
  type ConceptMessage,
  type ConceptGetRequest,
  type ConceptGetResponse,
  type ConceptDeleteRequest,
  type ConceptDeleteResponse,
  
  // Query operations
  QueryActions,
  QueryEvents,
  type QueryActionType,
  type QueryEventType,
  type QueryMessage,
  
  // Kind operations
  KindActions,
  KindEvents,
  type KindActionType,
  type KindEventType,
  type KindMessage,
  
  // UID operations
  UIDActions,
  UIDEvents,
  type UIDActionType,
  type UIDEventType,
  type UIDMessage,
  
  // Completion operations
  CompletionActions,
  CompletionEvents,
  type CompletionActionType,
  type CompletionEventType,
  type CompletionMessage,
  
  // Definition operations
  DefinitionActions,
  DefinitionEvents,
  type DefinitionActionType,
  type DefinitionEventType,
  type DefinitionMessage,
  type DefinitionUpdateRequest,
  type DefinitionUpdateResponse,
  
  // Submission operations
  SubmissionActions,
  SubmissionEvents,
  type SubmissionActionType,
  type SubmissionEventType,
  type SubmissionMessage,
  type SubmissionSubmitRequest,
  type SubmissionSubmitResponse,
  
  // Transaction operations
  TransactionActions,
  TransactionEvents,
  type TransactionActionType,
  type TransactionEventType,
  type TransactionMessage,
  
  // Validation operations
  ValidationActions,
  ValidationEvents,
  type ValidationActionType,
  type ValidationEventType,
  type ValidationMessage,
  
  // Lineage operations
  LineageActions,
  LineageEvents,
  type LineageActionType,
  type LineageEventType,
  type LineageQueryMessage,
  type LineageGetRequest,
  type LineageGetResponse,
} from './services/archivist';

export {
  // Aperture operations
  ApertureActions,
  type EnvironmentGetRequest,
  type EnvironmentListRequest,
  type EnvironmentCreateRequest,
  type EnvironmentClearRequest,
  type SearchLoadTextRequest,
  type SearchLoadUidRequest,
  type SpecializationLoadFactRequest,
  type SpecializationLoadRequest,
  type EntityLoadRequest,
  type EntityUnloadRequest,
  type EntitySelectRequest,
  type EntityDeselectRequest,
  type EntityLoadMultipleRequest,
  type EntityUnloadMultipleRequest,
  type SubtypeLoadRequest,
  type SubtypeLoadConeRequest,
  type SubtypeUnloadConeRequest,
  type ClassificationLoadRequest,
  type ClassificationLoadFactRequest,
  type CompositionLoadRequest,
  type CompositionLoadInRequest,
  type ConnectionLoadRequest,
  type ConnectionLoadInRequest,
  type RelationRequiredRolesLoadRequest,
  type RelationRolePlayersLoadRequest,
  type ApertureResponse,
  type SuccessResponse,
  type ErrorResponse,
  type FactsLoadedEvent,
  type FactsUnloadedEvent,
  type EntitySelectedEvent,
  type EntityDeselectedEvent,
  type Fact,
  type Environment,
} from './services/aperture';

export {
  // Portal user actions (knowledge-integrator → portal)
  PortalUserActions,
  PortalSystemEvents,
  PortalActions,
  type PortalUserActionType,
  type PortalSystemEventType,
  type PortalCommunicationType,
  type SelectEntityRequest,
  type SelectFactRequest,
  type SelectNoneRequest,
  type LoadSpecializationHierarchyRequest,
  type LoadEntityRequest,
  type ClearEntitiesRequest,
  type LoadAllRelatedFactsRequest,
  type LoadSubtypesConeRequest,
  type UnloadEntityRequest,
  type UnloadSubtypesConeRequest,
  type DeleteEntityRequest,
  type DeleteFactRequest,
  type LoadEntitiesRequest,
  type UnloadEntitiesRequest,
  type GetSpecializationHierarchyRequest,
  type StandardResponse,
  // Portal system events (portal → knowledge-integrator)
  type LoadedFactsEvent,
  type UnloadedFactsEvent,
  type SelectedEntityEvent,
  type SelectedFactEvent,
  type SelectedNoneEvent,
  type EntitiesClearedEvent,
  type StateInitializedEvent,
  type StateChangedEvent,
  type LoadedModelsEvent,
  type UnloadedModelsEvent,
  type UpdateCategoryDescendantsCacheEvent,
} from './services/portal';

export {
  // Clarity operations
  ClarityActions,
  type ClarityActionType,
  type ModelGetRequest,
  type ModelBatchRequest,
  type ModelCreateRequest,
  type ModelUpdateRequest,
  type KindGetRequest,
  type IndividualGetRequest,
  type ClarityEnvironmentGetRequest,
  type ModelResponse,
  type ModelBatchResponse,
  type KindResponse,
  type IndividualResponse,
  type ClarityEnvironmentResponse,
  type ClarityModelEvent,
  type ClarityIndividualEvent,
} from './services/clarity';