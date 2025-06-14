export interface WsMessage<T = any> {
  event: string;
  data: T;
}

export interface WsResponse<T = any> {
  event: string;
  data: T;
}

export interface WsError {
  event: string;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Fact operation message types
export interface FactCreateMessage {
  lh_object_uid: number;
  rh_object_uid: number;
  rel_type_uid: number;
  [key: string]: any;
}

export interface FactUpdateMessage {
  fact_uid: number;
  updates: Partial<FactCreateMessage>;
}

export interface FactDeleteMessage {
  fact_uid: number;
}

export interface FactQueryMessage {
  uid: number;
  includeSubtypes?: boolean;
  maxDepth?: number;
}

// Search message types
export interface SearchMessage {
  query: string;
  page?: number;
  limit?: number;
  filters?: any;
}

export interface CompletionMessage {
  query: string;
  context?: any;
}

// Validation message types
export interface ValidationMessage {
  fact: FactCreateMessage;
  context?: any;
}

// Query message types
export interface QueryMessage {
  query: string;
  parameters?: any;
}

// Entity retrieval message types
export interface EntityRetrievalMessage {
  uid: number;
  options?: any;
}

// Submission message types
export interface SubmissionMessage {
  facts: FactCreateMessage[];
  metadata?: any;
}

// Definition message types
export interface DefinitionMessage {
  uid: number;
  definition?: any;
}

// Concept message types
export interface ConceptMessage {
  uid: number;
  operation?: 'get' | 'create' | 'update' | 'delete';
  data?: any;
}

// Kind message types
export interface KindMessage {
  uid?: number;
  query?: string;
  filters?: any;
}

// Aspect message types
export interface AspectMessage {
  uid: number;
  operation?: string;
  data?: any;
}

// UID message types
export interface UIDMessage {
  count?: number;
  type?: string;
}

// Transaction message types
export interface TransactionMessage {
  transaction_id?: string;
  operations?: any[];
}