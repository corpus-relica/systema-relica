export interface ServiceMessage {
  id: string;
  type: 'request' | 'response' | 'event' | 'error';
  service: 'archivist' | 'clarity' | 'aperture' | 'prism' | 'shutter' | 'nous';
  action: string;
  payload: any;
  correlation_id?: string;
  user_id?: string;
  timestamp?: number;
}

export interface ServiceResponse extends ServiceMessage {
  type: 'response';
  success: boolean;
  error?: string;
  request_id?: string;
}

export interface ServiceError extends ServiceMessage {
  type: 'error';
  error: string;
  code?: string;
}

export interface ServiceEvent extends ServiceMessage {
  type: 'event';
  event_type: string;
}

export interface ClientMessage {
  id?: string;
  action: string;
  payload: any;
  token?: string;
}

export interface ClientResponse {
  id?: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface ClientEvent {
  type: string;
  data: any;
  timestamp?: number;
}

// Service-specific message types
export interface ArchivistMessage extends ServiceMessage {
  service: 'archivist';
  action: 
    | 'get-kinds'
    | 'search-text'
    | 'search-uid'
    | 'resolve-uids'
    | 'get-classified'
    | 'get-subtypes'
    | 'get-subtypes-cone'
    | 'submit-fact'
    | 'delete-fact';
}

export interface ClarityMessage extends ServiceMessage {
  service: 'clarity';
  action:
    | 'get-model'
    | 'get-kind-model'
    | 'get-individual-model'
    | 'create-model'
    | 'update-model'
    | 'get-environment';
}

export interface ApertureMessage extends ServiceMessage {
  service: 'aperture';
  action:
    | 'get-environment'
    | 'create-environment'
    | 'update-environment'
    | 'select-entity'
    | 'load-entities'
    | 'load-specialization-hierarchy'
    | 'clear-environment-entities'
    | 'load-all-related-facts';
}

export interface PrismMessage extends ServiceMessage {
  service: 'prism';
  action:
    | 'get-setup-status'
    | 'start-setup'
    | 'create-user'
    | 'import-data';
}

export interface NousMessage extends ServiceMessage {
  service: 'nous';
  action:
    | 'process-chat-input'
    | 'generate-response';
}

export interface ShutterMessage extends ServiceMessage {
  service: 'shutter';
  action:
    | 'validate-jwt'
    | 'authenticate'
    | 'refresh-token';
}