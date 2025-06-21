export { ArchivistSocketClient } from './clients/ArchivistSocketClient';
export { ClaritySocketClient } from './clients/ClaritySocketClient';
export { ApertureSocketClient } from './clients/ApertureSocketClient';
export { PrismSocketClient } from './clients/PrismSocketClient';
export { 
  PortalSocketClient, 
  BaseWebSocketClient,
  type ServiceMessage,
  type ServiceResponse,
  type WebSocketServiceClient 
} from './clients/PortalSocketClient';

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
  ApertureActions,
  ApertureEvents,
  PrismActions,
  PrismEvents,
} from '@relica/websocket-contracts';