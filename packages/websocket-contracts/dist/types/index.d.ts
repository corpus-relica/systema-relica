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
export * from './base';
export * from './services/prism';
export * from './services/archivist';
export * from './services/aperture';
export * from './registry';
export * from './validation';
export { ContractUtils, validator, devValidator, ContractValidator, } from './validation';
export { PrismActions, PrismEvents, SetupStatusBroadcastEventSchema, type SetupStatusBroadcastEvent, type PrismEventType, } from './services/prism';
export { FactActions, FactEvents, type FactActionType, type FactEventType, type FactCreateMessage, type FactUpdateMessage, type FactDeleteMessage, type FactQueryMessage, type FactCreateRequest, type FactCreateResponse, type FactGetRequest, type FactGetResponse, type FactDeleteRequest, type FactDeleteResponse, type FactBatchGetRequest, type FactBatchGetResponse, type FactBatchGetMessage, type FactCountRequest, type FactCountResponse, SearchActions, SearchEvents, type SearchActionType, type SearchEventType, type SearchMessage, type SearchGeneralRequest, type SearchGeneralResponse, ConceptActions, ConceptEvents, type ConceptActionType, type ConceptEventType, type ConceptMessage, type ConceptGetRequest, type ConceptGetResponse, type ConceptDeleteRequest, type ConceptDeleteResponse, QueryActions, QueryEvents, type QueryActionType, type QueryEventType, type QueryMessage, KindActions, KindEvents, type KindActionType, type KindEventType, type KindMessage, UIDActions, UIDEvents, type UIDActionType, type UIDEventType, type UIDMessage, CompletionActions, CompletionEvents, type CompletionActionType, type CompletionEventType, type CompletionMessage, DefinitionActions, DefinitionEvents, type DefinitionActionType, type DefinitionEventType, type DefinitionMessage, type DefinitionUpdateRequest, type DefinitionUpdateResponse, SubmissionActions, SubmissionEvents, type SubmissionActionType, type SubmissionEventType, type SubmissionMessage, type SubmissionSubmitRequest, type SubmissionSubmitResponse, TransactionActions, TransactionEvents, type TransactionActionType, type TransactionEventType, type TransactionMessage, ValidationActions, ValidationEvents, type ValidationActionType, type ValidationEventType, type ValidationMessage, LineageActions, LineageEvents, type LineageActionType, type LineageEventType, type LineageQueryMessage, type LineageGetRequest, type LineageGetResponse, } from './services/archivist';
export { ApertureActions, type EnvironmentGetRequest, type EnvironmentListRequest, type EnvironmentCreateRequest, type EnvironmentClearRequest, type SearchLoadTextRequest, type SearchLoadUidRequest, type SpecializationLoadFactRequest, type SpecializationLoadRequest, type EntityLoadRequest, type EntityUnloadRequest, type EntitySelectRequest, type EntityDeselectRequest, type EntityLoadMultipleRequest, type EntityUnloadMultipleRequest, type SubtypeLoadRequest, type SubtypeLoadConeRequest, type SubtypeUnloadConeRequest, type ClassificationLoadRequest, type ClassificationLoadFactRequest, type CompositionLoadRequest, type CompositionLoadInRequest, type ConnectionLoadRequest, type ConnectionLoadInRequest, type RelationRequiredRolesLoadRequest, type RelationRolePlayersLoadRequest, type ApertureResponse, type SuccessResponse, type ErrorResponse, type FactsLoadedEvent, type FactsUnloadedEvent, type EntitySelectedEvent, type EntityDeselectedEvent, type Fact, type Environment, } from './services/aperture';
//# sourceMappingURL=index.d.ts.map