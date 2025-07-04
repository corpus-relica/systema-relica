// Ruthless alignment with shared contracts - use as single source of truth
import { BaseRequest, BaseResponse, BaseEvent } from '@relica/websocket-contracts';
import { PrismActionType, EntityActionType, KindActionType, SearchActionType, ApertureActionType, ClarityActionType } from '@relica/websocket-contracts';

// All service messages now use shared contract structure
export type ServiceMessage = BaseRequest;
export type ServiceResponse = BaseResponse;
export type ServiceEvent = BaseEvent;

// Client types (for frontend communication)
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

// Prism uses shared contracts (aligned)
export interface PrismMessage extends BaseRequest {
  service: 'prism';
  action: PrismActionType;
}

// Other services use shared structure but local action types (for now)
export interface ArchivistMessage extends BaseRequest {
  service: 'archivist';
  action: 
    | EntityActionType
    | KindActionType
    | SearchActionType
    | 'search-uid'
    | 'resolve-uids'
    | 'get-classified'
    | 'get-subtypes'
    | 'get-subtypes-cone'
    | 'submit-fact'
    | 'delete-fact'
    // Legacy actions (to be migrated to contracts)
    | 'get-kinds';
}

export interface ClarityMessage extends BaseRequest {
  service: 'clarity';
  action: ClarityActionType;
}

export interface ApertureMessage extends BaseRequest {
  service: 'aperture';
  action:
    | ApertureActionType
    | 'get-environment'
    | 'create-environment'
    | 'update-environment'
    | 'select-entity'
    | 'load-entities'
    | 'clear-environment-entities'
    | 'load-all-related-facts';
}

export interface NousMessage extends BaseRequest {
  service: 'nous';
  action:
    | 'process-chat-input'
    | 'generate-response';
}

export interface ShutterMessage extends BaseRequest {
  service: 'shutter';
  action:
    | 'validate-jwt'
    | 'authenticate'
    | 'refresh-token';
}