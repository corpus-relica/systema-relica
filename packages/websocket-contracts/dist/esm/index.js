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
// Message registry and utilities
export * from './registry';
// Validation utilities
export * from './validation';
// Re-export commonly used items for convenience
export { ContractUtils, validator, devValidator, ContractValidator, } from './validation';
export { PrismActions, PrismEvents, SetupStatusBroadcastEventSchema, } from './services/prism';
export { 
// Fact operations
FactActions, FactEvents, 
// Search operations
SearchActions, SearchEvents, 
// Concept operations
ConceptActions, ConceptEvents, 
// Query operations
QueryActions, QueryEvents, 
// Kind operations
KindActions, KindEvents, 
// UID operations
UIDActions, UIDEvents, 
// Completion operations
CompletionActions, CompletionEvents, 
// Definition operations
DefinitionActions, DefinitionEvents, 
// Submission operations
SubmissionActions, SubmissionEvents, 
// Transaction operations
TransactionActions, TransactionEvents, 
// Validation operations
ValidationActions, ValidationEvents, 
// Lineage operations
LineageActions, LineageEvents, } from './services/archivist';
export { 
// Aperture operations
ApertureActions, } from './services/aperture';
//# sourceMappingURL=index.js.map