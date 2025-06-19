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

// Lineage operations
export * from './lineage';

// Entity operations
export * from './entities';

// Import actions to create combined object
import {
  FactActions,
  FactEvents,
  type FactActionType,
  type FactEventType,
} from './facts';

import {
  SearchActions,
  SearchEvents,
  type SearchActionType,
  type SearchEventType,
} from './search';

import {
  ConceptActions,
  ConceptEvents,
  type ConceptActionType,
  type ConceptEventType,
} from './concepts';

import {
  QueryActions,
  QueryEvents,
  type QueryActionType,
  type QueryEventType,
} from './query';

import {
  KindActions,
  KindEvents,
  type KindActionType,
  type KindEventType,
} from './kinds';

import {
  UIDActions,
  UIDEvents,
  type UIDActionType,
  type UIDEventType,
} from './uids';

import {
  CompletionActions,
  CompletionEvents,
  type CompletionActionType,
  type CompletionEventType,
} from './completion';

import {
  DefinitionActions,
  DefinitionEvents,
  type DefinitionActionType,
  type DefinitionEventType,
} from './definition';

import {
  SubmissionActions,
  SubmissionEvents,
  type SubmissionActionType,
  type SubmissionEventType,
} from './submission';

import {
  TransactionActions,
  TransactionEvents,
  type TransactionActionType,
  type TransactionEventType,
} from './transaction';

import {
  ValidationActions,
  ValidationEvents,
  type ValidationActionType,
  type ValidationEventType,
} from './validation';

import {
  LineageActions,
  LineageEvents,
  type LineageActionType,
  type LineageEventType,
} from './lineage';

import {
  EntityActions,
  EntityEvents,
  type EntityActionType,
  type EntityEventType,
} from './entities';

// Re-export commonly used action constants
export {
  FactActions,
  FactEvents,
  type FactActionType,
  type FactEventType,
};

export {
  SearchActions,
  SearchEvents,
  type SearchActionType,
  type SearchEventType,
};

export {
  ConceptActions,
  ConceptEvents,
  type ConceptActionType,
  type ConceptEventType,
};

export {
  QueryActions,
  QueryEvents,
  type QueryActionType,
  type QueryEventType,
};

export {
  KindActions,
  KindEvents,
  type KindActionType,
  type KindEventType,
};

export {
  UIDActions,
  UIDEvents,
  type UIDActionType,
  type UIDEventType,
};

export {
  CompletionActions,
  CompletionEvents,
  type CompletionActionType,
  type CompletionEventType,
};

export {
  DefinitionActions,
  DefinitionEvents,
  type DefinitionActionType,
  type DefinitionEventType,
};

export {
  SubmissionActions,
  SubmissionEvents,
  type SubmissionActionType,
  type SubmissionEventType,
};

export {
  TransactionActions,
  TransactionEvents,
  type TransactionActionType,
  type TransactionEventType,
};

export {
  ValidationActions,
  ValidationEvents,
  type ValidationActionType,
  type ValidationEventType,
};

export {
  LineageActions,
  LineageEvents,
  type LineageActionType,
  type LineageEventType,
};

export {
  EntityActions,
  EntityEvents,
  type EntityActionType,
  type EntityEventType,
};

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
  // Lineage
  ...LineageActions,
  // Entity
  ...EntityActions,
} as const;