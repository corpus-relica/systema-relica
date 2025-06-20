export { ArchivistSocketClient } from './clients/ArchivistSocketClient';
export { ClaritySocketClient } from './clients/ClaritySocketClient';

// Re-export commonly used types for convenience
export type {
  FactActions,
  SearchActions,
  ConceptActions,
  SubmissionActions,
  DefinitionActions,
  KindActions,
  EntityActions,
  QueryActions,
  UIDActions,
  CompletionActions,
  TransactionActions,
  ValidationActions,
  SpecializationActions,
  ClarityActions,
} from '@relica/websocket-contracts';