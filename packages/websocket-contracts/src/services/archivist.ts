/**
 * @fileoverview Archivist Service WebSocket Contracts
 * 
 * Main export file for all Archivist service WebSocket contracts.
 * The Archivist service handles knowledge graph operations, search,
 * facts, concepts, and data management.
 */

// Export everything from the archivist directory
export * from './archivist/index';

// Convenient re-exports for the most commonly used items
export {
  // Fact operations
  FactActions,
  FactEvents,
  FactCreateRequestSchema,
  FactCreateResponseSchema,
  type FactCreateRequest,
  type FactCreateResponse,
  type FactCreateMessage,

  // Search operations
  SearchActions,
  SearchEvents,
  SearchGeneralRequestSchema,
  SearchGeneralResponseSchema,
  type SearchGeneralRequest,
  type SearchGeneralResponse,
  type SearchMessage,

  // Concept operations
  ConceptActions,
  ConceptEvents,
  ConceptGetRequestSchema,
  ConceptGetResponseSchema,
  type ConceptGetRequest,
  type ConceptGetResponse,
  type ConceptMessage,

  // Query operations
  QueryActions,
  QueryEvents,
  QueryExecuteRequestSchema,
  QueryExecuteResponseSchema,
  type QueryExecuteRequest,
  type QueryExecuteResponse,
  type QueryMessage,

  // Kind operations
  KindActions,
  KindEvents,
  KindGetRequestSchema,
  KindGetResponseSchema,
  type KindGetRequest,
  type KindGetResponse,
  type KindMessage,

  // UID operations
  UIDActions,
  UIDEvents,
  UIDGenerateRequestSchema,
  UIDGenerateResponseSchema,
  type UIDGenerateRequest,
  type UIDGenerateResponse,
  type UIDMessage,

} from './archivist/index';