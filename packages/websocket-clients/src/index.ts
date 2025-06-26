export { ArchivistSocketClient } from './clients/ArchivistSocketClient';
export { ClaritySocketClient } from './clients/ClaritySocketClient';
export { ApertureSocketClient } from './clients/ApertureSocketClient';
export { PrismSocketClient } from './clients/PrismSocketClient';
export { NOUSSocketClient } from './clients/NOUSSocketClient';
export { PortalSocketClient } from './clients/PortalSocketClient';
export { 
  BaseWebSocketClient,
  type ServiceMessage,
  type ServiceResponse,
  type WebSocketServiceClient 
} from './clients/BaseWebSocketClient';

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
  NOUSActions,
  NOUSEvents,
} from '@relica/websocket-contracts';