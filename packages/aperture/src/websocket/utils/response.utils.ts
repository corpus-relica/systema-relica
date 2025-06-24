import { randomUUID } from 'crypto';

export interface BaseResponse {
  id: string;
  type: 'response';
  success: boolean;
  data?: any;
  error?: string;
  correlationId?: string;
  timestamp: number;
}

export function toResponse(data: any, correlationId?: string): BaseResponse {
  return {
    id: randomUUID(),
    type: 'response',
    success: true,
    data,
    correlationId,
    timestamp: Date.now()
  };
}

export function toErrorResponse(error: any, correlationId?: string): BaseResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return {
    id: randomUUID(),
    type: 'response',
    success: false,
    error: errorMessage,
    correlationId,
    timestamp: Date.now()
  };
}