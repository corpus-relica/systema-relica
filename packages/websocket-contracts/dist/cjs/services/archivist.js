"use strict";
/**
 * @fileoverview Archivist Service WebSocket Contracts
 *
 * Main export file for all Archivist service WebSocket contracts.
 * The Archivist service handles knowledge graph operations, search,
 * facts, concepts, and data management.
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
exports.UIDGenerateResponseSchema = exports.UIDGenerateRequestSchema = exports.UIDEvents = exports.UIDActions = exports.KindGetResponseSchema = exports.KindGetRequestSchema = exports.KindEvents = exports.KindActions = exports.QueryExecuteResponseSchema = exports.QueryExecuteRequestSchema = exports.QueryEvents = exports.QueryActions = exports.ConceptGetResponseSchema = exports.ConceptGetRequestSchema = exports.ConceptEvents = exports.ConceptActions = exports.SearchGeneralResponseSchema = exports.SearchGeneralRequestSchema = exports.SearchEvents = exports.SearchActions = exports.FactCreateResponseSchema = exports.FactCreateRequestSchema = exports.FactEvents = exports.FactActions = void 0;
// Export everything from the archivist directory
__exportStar(require("./archivist/index"), exports);
// Convenient re-exports for the most commonly used items
var index_1 = require("./archivist/index");
// Fact operations
Object.defineProperty(exports, "FactActions", { enumerable: true, get: function () { return index_1.FactActions; } });
Object.defineProperty(exports, "FactEvents", { enumerable: true, get: function () { return index_1.FactEvents; } });
Object.defineProperty(exports, "FactCreateRequestSchema", { enumerable: true, get: function () { return index_1.FactCreateRequestSchema; } });
Object.defineProperty(exports, "FactCreateResponseSchema", { enumerable: true, get: function () { return index_1.FactCreateResponseSchema; } });
// Search operations
Object.defineProperty(exports, "SearchActions", { enumerable: true, get: function () { return index_1.SearchActions; } });
Object.defineProperty(exports, "SearchEvents", { enumerable: true, get: function () { return index_1.SearchEvents; } });
Object.defineProperty(exports, "SearchGeneralRequestSchema", { enumerable: true, get: function () { return index_1.SearchGeneralRequestSchema; } });
Object.defineProperty(exports, "SearchGeneralResponseSchema", { enumerable: true, get: function () { return index_1.SearchGeneralResponseSchema; } });
// Concept operations
Object.defineProperty(exports, "ConceptActions", { enumerable: true, get: function () { return index_1.ConceptActions; } });
Object.defineProperty(exports, "ConceptEvents", { enumerable: true, get: function () { return index_1.ConceptEvents; } });
Object.defineProperty(exports, "ConceptGetRequestSchema", { enumerable: true, get: function () { return index_1.ConceptGetRequestSchema; } });
Object.defineProperty(exports, "ConceptGetResponseSchema", { enumerable: true, get: function () { return index_1.ConceptGetResponseSchema; } });
// Query operations
Object.defineProperty(exports, "QueryActions", { enumerable: true, get: function () { return index_1.QueryActions; } });
Object.defineProperty(exports, "QueryEvents", { enumerable: true, get: function () { return index_1.QueryEvents; } });
Object.defineProperty(exports, "QueryExecuteRequestSchema", { enumerable: true, get: function () { return index_1.QueryExecuteRequestSchema; } });
Object.defineProperty(exports, "QueryExecuteResponseSchema", { enumerable: true, get: function () { return index_1.QueryExecuteResponseSchema; } });
// Kind operations
Object.defineProperty(exports, "KindActions", { enumerable: true, get: function () { return index_1.KindActions; } });
Object.defineProperty(exports, "KindEvents", { enumerable: true, get: function () { return index_1.KindEvents; } });
Object.defineProperty(exports, "KindGetRequestSchema", { enumerable: true, get: function () { return index_1.KindGetRequestSchema; } });
Object.defineProperty(exports, "KindGetResponseSchema", { enumerable: true, get: function () { return index_1.KindGetResponseSchema; } });
// UID operations
Object.defineProperty(exports, "UIDActions", { enumerable: true, get: function () { return index_1.UIDActions; } });
Object.defineProperty(exports, "UIDEvents", { enumerable: true, get: function () { return index_1.UIDEvents; } });
Object.defineProperty(exports, "UIDGenerateRequestSchema", { enumerable: true, get: function () { return index_1.UIDGenerateRequestSchema; } });
Object.defineProperty(exports, "UIDGenerateResponseSchema", { enumerable: true, get: function () { return index_1.UIDGenerateResponseSchema; } });
//# sourceMappingURL=archivist.js.map