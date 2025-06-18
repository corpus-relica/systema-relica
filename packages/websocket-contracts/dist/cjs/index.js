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
exports.ApertureActions = exports.LineageEvents = exports.LineageActions = exports.ValidationEvents = exports.ValidationActions = exports.TransactionEvents = exports.TransactionActions = exports.SubmissionEvents = exports.SubmissionActions = exports.DefinitionEvents = exports.DefinitionActions = exports.CompletionEvents = exports.CompletionActions = exports.UIDEvents = exports.UIDActions = exports.KindEvents = exports.KindActions = exports.QueryEvents = exports.QueryActions = exports.ConceptEvents = exports.ConceptActions = exports.SearchEvents = exports.SearchActions = exports.FactEvents = exports.FactActions = exports.SetupStatusBroadcastEventSchema = exports.PrismEvents = exports.PrismActions = exports.ContractValidator = exports.devValidator = exports.validator = exports.ContractUtils = void 0;
// Base message types
__exportStar(require("./base"), exports);
// Service-specific contracts
__exportStar(require("./services/prism"), exports);
__exportStar(require("./services/archivist"), exports);
__exportStar(require("./services/aperture"), exports);
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
var archivist_1 = require("./services/archivist");
// Fact operations
Object.defineProperty(exports, "FactActions", { enumerable: true, get: function () { return archivist_1.FactActions; } });
Object.defineProperty(exports, "FactEvents", { enumerable: true, get: function () { return archivist_1.FactEvents; } });
// Search operations
Object.defineProperty(exports, "SearchActions", { enumerable: true, get: function () { return archivist_1.SearchActions; } });
Object.defineProperty(exports, "SearchEvents", { enumerable: true, get: function () { return archivist_1.SearchEvents; } });
// Concept operations
Object.defineProperty(exports, "ConceptActions", { enumerable: true, get: function () { return archivist_1.ConceptActions; } });
Object.defineProperty(exports, "ConceptEvents", { enumerable: true, get: function () { return archivist_1.ConceptEvents; } });
// Query operations
Object.defineProperty(exports, "QueryActions", { enumerable: true, get: function () { return archivist_1.QueryActions; } });
Object.defineProperty(exports, "QueryEvents", { enumerable: true, get: function () { return archivist_1.QueryEvents; } });
// Kind operations
Object.defineProperty(exports, "KindActions", { enumerable: true, get: function () { return archivist_1.KindActions; } });
Object.defineProperty(exports, "KindEvents", { enumerable: true, get: function () { return archivist_1.KindEvents; } });
// UID operations
Object.defineProperty(exports, "UIDActions", { enumerable: true, get: function () { return archivist_1.UIDActions; } });
Object.defineProperty(exports, "UIDEvents", { enumerable: true, get: function () { return archivist_1.UIDEvents; } });
// Completion operations
Object.defineProperty(exports, "CompletionActions", { enumerable: true, get: function () { return archivist_1.CompletionActions; } });
Object.defineProperty(exports, "CompletionEvents", { enumerable: true, get: function () { return archivist_1.CompletionEvents; } });
// Definition operations
Object.defineProperty(exports, "DefinitionActions", { enumerable: true, get: function () { return archivist_1.DefinitionActions; } });
Object.defineProperty(exports, "DefinitionEvents", { enumerable: true, get: function () { return archivist_1.DefinitionEvents; } });
// Submission operations
Object.defineProperty(exports, "SubmissionActions", { enumerable: true, get: function () { return archivist_1.SubmissionActions; } });
Object.defineProperty(exports, "SubmissionEvents", { enumerable: true, get: function () { return archivist_1.SubmissionEvents; } });
// Transaction operations
Object.defineProperty(exports, "TransactionActions", { enumerable: true, get: function () { return archivist_1.TransactionActions; } });
Object.defineProperty(exports, "TransactionEvents", { enumerable: true, get: function () { return archivist_1.TransactionEvents; } });
// Validation operations
Object.defineProperty(exports, "ValidationActions", { enumerable: true, get: function () { return archivist_1.ValidationActions; } });
Object.defineProperty(exports, "ValidationEvents", { enumerable: true, get: function () { return archivist_1.ValidationEvents; } });
// Lineage operations
Object.defineProperty(exports, "LineageActions", { enumerable: true, get: function () { return archivist_1.LineageActions; } });
Object.defineProperty(exports, "LineageEvents", { enumerable: true, get: function () { return archivist_1.LineageEvents; } });
var aperture_1 = require("./services/aperture");
// Aperture operations
Object.defineProperty(exports, "ApertureActions", { enumerable: true, get: function () { return aperture_1.ApertureActions; } });
//# sourceMappingURL=index.js.map