/**
 * @fileoverview Archivist Service WebSocket Contracts
 *
 * Complete WebSocket API contracts for the Archivist service, which handles
 * knowledge graph operations, search, facts, concepts, and data management.
 */
// Fact operations
export * from './facts';
// Search operations  
export * from './search';
// Concept operations
export * from './concepts';
// Query operations
export * from './query';
// Kind operations
export * from './kinds';
// UID generation
export * from './uids';
// Completion operations
export * from './completion';
// Definition operations
export * from './definition';
// Submission operations
export * from './submission';
// Transaction operations
export * from './transaction';
// Validation operations
export * from './validation';
// Import actions to create combined object
import { FactActions, FactEvents, } from './facts';
import { SearchActions, SearchEvents, } from './search';
import { ConceptActions, ConceptEvents, } from './concepts';
import { QueryActions, QueryEvents, } from './query';
import { KindActions, KindEvents, } from './kinds';
import { UIDActions, UIDEvents, } from './uids';
import { CompletionActions, CompletionEvents, } from './completion';
import { DefinitionActions, DefinitionEvents, } from './definition';
import { SubmissionActions, SubmissionEvents, } from './submission';
import { TransactionActions, TransactionEvents, } from './transaction';
import { ValidationActions, ValidationEvents, } from './validation';
// Re-export commonly used action constants
export { FactActions, FactEvents, };
export { SearchActions, SearchEvents, };
export { ConceptActions, ConceptEvents, };
export { QueryActions, QueryEvents, };
export { KindActions, KindEvents, };
export { UIDActions, UIDEvents, };
export { CompletionActions, CompletionEvents, };
export { DefinitionActions, DefinitionEvents, };
export { SubmissionActions, SubmissionEvents, };
export { TransactionActions, TransactionEvents, };
export { ValidationActions, ValidationEvents, };
// All Archivist actions combined
export const ArchivistActions = {
    // Facts
    ...FactActions,
    // Search  
    ...SearchActions,
    // Concepts
    ...ConceptActions,
    // Query
    ...QueryActions,
    // Kinds
    ...KindActions,
    // UIDs
    ...UIDActions,
    // Completion
    ...CompletionActions,
    // Definition
    ...DefinitionActions,
    // Submission
    ...SubmissionActions,
    // Transaction
    ...TransactionActions,
    // Validation
    ...ValidationActions,
};
//# sourceMappingURL=index.js.map