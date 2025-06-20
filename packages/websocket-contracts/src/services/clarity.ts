// Clarity WebSocket Service Contracts
// Semantic modeling and AI inference operations

export const ClarityActions = {
  // Model operations
  MODEL_GET: 'clarity/model-get',
  MODEL_GET_BATCH: 'clarity/model-get-batch',
  MODEL_CREATE: 'clarity/model-create', 
  MODEL_UPDATE: 'clarity/model-update',

  // Kind operations
  KIND_GET: 'clarity/kind-get',

  // Individual operations  
  INDIVIDUAL_GET: 'clarity/individual-get',

  // Environment operations
  ENVIRONMENT_GET: 'clarity/environment-get',

  // System operations (common across services)
  STATUS_REQUEST: 'clarity/status-request',
  HEARTBEAT: 'clarity/heartbeat',
} as const;

export type ClarityActionType = typeof ClarityActions[keyof typeof ClarityActions];

// Request/Response schemas for Clarity operations
export interface ModelGetRequest {
  uid?: string;
}

export interface ModelBatchRequest {
  uids: string[];
}

export interface ModelCreateRequest {
  name: string;
  type: string;
  data: any;
}

export interface ModelUpdateRequest {
  modelId: string;
  name?: string;
  type?: string;
  data?: any;
}

export interface KindGetRequest {
  uid: string;
}

export interface IndividualGetRequest {
  uid: string;
}

export interface ClarityEnvironmentGetRequest {
  environmentId: string;
}

// Response types
export interface ModelResponse {
  success: boolean;
  model?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ModelBatchResponse {
  success: boolean;
  models?: any[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface KindResponse {
  success: boolean;
  model?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface IndividualResponse {
  success: boolean;
  model?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ClarityEnvironmentResponse {
  success: boolean;
  environment?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Event types for real-time updates
export interface ClarityModelEvent {
  type: 'model-updated' | 'model-created' | 'model-deleted';
  modelId: string;
  timestamp: number;
  data?: any;
}

export interface ClarityIndividualEvent {
  type: 'individual-updated' | 'individual-created' | 'individual-deleted';
  individualId: string;
  timestamp: number;
  data?: any;
}