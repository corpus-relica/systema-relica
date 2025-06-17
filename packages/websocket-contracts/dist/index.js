"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupStatusBroadcastEventSchema = exports.PrismEvents = exports.PrismActions = exports.ContractValidator = exports.devValidator = exports.validator = exports.ContractUtils = void 0;
// Base message types
__exportStar(require("./base"), exports);
// Service-specific contracts
__exportStar(require("./services/prism"), exports);
// Message registry and utilities
__exportStar(require("./registry"), exports);
// Validation utilities
__exportStar(require("./validation"), exports);
// Re-export commonly used items for convenience
var validation_1 = require("./validation");
Object.defineProperty(exports, "ContractUtils", { enumerable: true, get: function () { return validation_1.ContractUtils; } });
Object.defineProperty(exports, "validator", { enumerable: true, get: function () { return validation_1.validator; } });
Object.defineProperty(exports, "devValidator", { enumerable: true, get: function () { return validation_1.devValidator; } });
Object.defineProperty(exports, "ContractValidator", { enumerable: true, get: function () { return validation_1.ContractValidator; } });
var prism_1 = require("./services/prism");
Object.defineProperty(exports, "PrismActions", { enumerable: true, get: function () { return prism_1.PrismActions; } });
Object.defineProperty(exports, "PrismEvents", { enumerable: true, get: function () { return prism_1.PrismEvents; } });
Object.defineProperty(exports, "SetupStatusBroadcastEventSchema", { enumerable: true, get: function () { return prism_1.SetupStatusBroadcastEventSchema; } });
//# sourceMappingURL=index.js.map