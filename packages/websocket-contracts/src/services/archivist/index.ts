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

// Re-export commonly used action constants
export {
  FactActions,
  FactEvents,
  type FactActionType,
  type FactEventType,
} from './facts';

export {
  SearchActions,
  SearchEvents,
  type SearchActionType,
  type SearchEventType,
} from './search';

export {
  ConceptActions,
  ConceptEvents,
  type ConceptActionType,
  type ConceptEventType,
} from './concepts';

export {
  QueryActions,
  QueryEvents,
  type QueryActionType,
  type QueryEventType,
} from './query';

export {
  KindActions,
  KindEvents,
  type KindActionType,
  type KindEventType,
} from './kinds';

export {
  UIDActions,
  UIDEvents,
  type UIDActionType,
  type UIDEventType,
} from './uids';

export {
  CompletionActions,
  CompletionEvents,
  type CompletionActionType,
  type CompletionEventType,
} from './completion';

export {
  DefinitionActions,
  DefinitionEvents,
  type DefinitionActionType,
  type DefinitionEventType,
} from './definition';

export {
  SubmissionActions,
  SubmissionEvents,
  type SubmissionActionType,
  type SubmissionEventType,
} from './submission';

export {
  TransactionActions,
  TransactionEvents,
  type TransactionActionType,
  type TransactionEventType,
} from './transaction';

export {
  ValidationActions,
  ValidationEvents,
  type ValidationActionType,
  type ValidationEventType,
} from './validation';

// All Archivist actions combined
export const ArchivistActions = {
  // Facts
  ...require('./facts').FactActions,
  // Search  
  ...require('./search').SearchActions,
  // Concepts
  ...require('./concepts').ConceptActions,
  // Query
  ...require('./query').QueryActions,
  // Kinds
  ...require('./kinds').KindActions,
  // UIDs
  ...require('./uids').UIDActions,
  // Completion
  ...require('./completion').CompletionActions,
  // Definition
  ...require('./definition').DefinitionActions,
  // Submission
  ...require('./submission').SubmissionActions,
  // Transaction
  ...require('./transaction').TransactionActions,
  // Validation
  ...require('./validation').ValidationActions,
} as const;