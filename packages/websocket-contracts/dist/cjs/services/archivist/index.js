"use strict";
/**
 * @fileoverview Archivist Service WebSocket Contracts
 *
 * Complete WebSocket API contracts for the Archivist service, which handles
 * knowledge graph operations, search, facts, concepts, and data management.
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
exports.ArchivistActions = exports.LineageEvents = exports.LineageActions = exports.ValidationEvents = exports.ValidationActions = exports.TransactionEvents = exports.TransactionActions = exports.SubmissionEvents = exports.SubmissionActions = exports.DefinitionEvents = exports.DefinitionActions = exports.CompletionEvents = exports.CompletionActions = exports.UIDEvents = exports.UIDActions = exports.KindEvents = exports.KindActions = exports.QueryEvents = exports.QueryActions = exports.ConceptEvents = exports.ConceptActions = exports.SearchEvents = exports.SearchActions = exports.FactEvents = exports.FactActions = void 0;
// Fact operations
__exportStar(require("./facts"), exports);
// Search operations  
__exportStar(require("./search"), exports);
// Concept operations
__exportStar(require("./concepts"), exports);
// Query operations
__exportStar(require("./query"), exports);
// Kind operations
__exportStar(require("./kinds"), exports);
// UID generation
__exportStar(require("./uids"), exports);
// Completion operations
__exportStar(require("./completion"), exports);
// Definition operations
__exportStar(require("./definition"), exports);
// Submission operations
__exportStar(require("./submission"), exports);
// Transaction operations
__exportStar(require("./transaction"), exports);
// Validation operations
__exportStar(require("./validation"), exports);
// Lineage operations
__exportStar(require("./lineage"), exports);
// Import actions to create combined object
const facts_1 = require("./facts");
Object.defineProperty(exports, "FactActions", { enumerable: true, get: function () { return facts_1.FactActions; } });
Object.defineProperty(exports, "FactEvents", { enumerable: true, get: function () { return facts_1.FactEvents; } });
const search_1 = require("./search");
Object.defineProperty(exports, "SearchActions", { enumerable: true, get: function () { return search_1.SearchActions; } });
Object.defineProperty(exports, "SearchEvents", { enumerable: true, get: function () { return search_1.SearchEvents; } });
const concepts_1 = require("./concepts");
Object.defineProperty(exports, "ConceptActions", { enumerable: true, get: function () { return concepts_1.ConceptActions; } });
Object.defineProperty(exports, "ConceptEvents", { enumerable: true, get: function () { return concepts_1.ConceptEvents; } });
const query_1 = require("./query");
Object.defineProperty(exports, "QueryActions", { enumerable: true, get: function () { return query_1.QueryActions; } });
Object.defineProperty(exports, "QueryEvents", { enumerable: true, get: function () { return query_1.QueryEvents; } });
const kinds_1 = require("./kinds");
Object.defineProperty(exports, "KindActions", { enumerable: true, get: function () { return kinds_1.KindActions; } });
Object.defineProperty(exports, "KindEvents", { enumerable: true, get: function () { return kinds_1.KindEvents; } });
const uids_1 = require("./uids");
Object.defineProperty(exports, "UIDActions", { enumerable: true, get: function () { return uids_1.UIDActions; } });
Object.defineProperty(exports, "UIDEvents", { enumerable: true, get: function () { return uids_1.UIDEvents; } });
const completion_1 = require("./completion");
Object.defineProperty(exports, "CompletionActions", { enumerable: true, get: function () { return completion_1.CompletionActions; } });
Object.defineProperty(exports, "CompletionEvents", { enumerable: true, get: function () { return completion_1.CompletionEvents; } });
const definition_1 = require("./definition");
Object.defineProperty(exports, "DefinitionActions", { enumerable: true, get: function () { return definition_1.DefinitionActions; } });
Object.defineProperty(exports, "DefinitionEvents", { enumerable: true, get: function () { return definition_1.DefinitionEvents; } });
const submission_1 = require("./submission");
Object.defineProperty(exports, "SubmissionActions", { enumerable: true, get: function () { return submission_1.SubmissionActions; } });
Object.defineProperty(exports, "SubmissionEvents", { enumerable: true, get: function () { return submission_1.SubmissionEvents; } });
const transaction_1 = require("./transaction");
Object.defineProperty(exports, "TransactionActions", { enumerable: true, get: function () { return transaction_1.TransactionActions; } });
Object.defineProperty(exports, "TransactionEvents", { enumerable: true, get: function () { return transaction_1.TransactionEvents; } });
const validation_1 = require("./validation");
Object.defineProperty(exports, "ValidationActions", { enumerable: true, get: function () { return validation_1.ValidationActions; } });
Object.defineProperty(exports, "ValidationEvents", { enumerable: true, get: function () { return validation_1.ValidationEvents; } });
const lineage_1 = require("./lineage");
Object.defineProperty(exports, "LineageActions", { enumerable: true, get: function () { return lineage_1.LineageActions; } });
Object.defineProperty(exports, "LineageEvents", { enumerable: true, get: function () { return lineage_1.LineageEvents; } });
// All Archivist actions combined
exports.ArchivistActions = {
    // Facts
    ...facts_1.FactActions,
    // Search  
    ...search_1.SearchActions,
    // Concepts
    ...concepts_1.ConceptActions,
    // Query
    ...query_1.QueryActions,
    // Kinds
    ...kinds_1.KindActions,
    // UIDs
    ...uids_1.UIDActions,
    // Completion
    ...completion_1.CompletionActions,
    // Definition
    ...definition_1.DefinitionActions,
    // Submission
    ...submission_1.SubmissionActions,
    // Transaction
    ...transaction_1.TransactionActions,
    // Validation
    ...validation_1.ValidationActions,
    // Lineage
    ...lineage_1.LineageActions,
};
//# sourceMappingURL=index.js.map