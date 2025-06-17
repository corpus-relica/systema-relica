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
 * // Get WebSocket topic for Portal action
 * const topic = MessageRegistryUtils.getTopic(PrismActions.GET_SETUP_STATUS);
 * // Returns: ':prism.setup/get-status'
 *
 * // Validate message against contract
 * const validation = ContractUtils.validate.request('get-setup-status', message);
 * if (validation.success) {
 *   // Message is valid
 * }
 * ```
 */
export * from './base';
export * from './services/prism';
export * from './registry';
export * from './validation';
export { ContractUtils, validator, devValidator, ContractValidator, } from './validation';
export { PrismActions, PrismEvents, SetupStatusBroadcastEventSchema, type SetupStatusBroadcastEvent, type PrismEventType, } from './services/prism';
//# sourceMappingURL=index.d.ts.map