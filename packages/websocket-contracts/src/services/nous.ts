import { z } from 'zod';

// NOUS WebSocket Actions - direct event names matching Python server
export const NOUSActions = {
  CHAT_PROCESS_INPUT: 'process-chat-input',
  AI_GENERATE_RESPONSE: 'generate-response',
  SYSTEM_PING: 'ping',
  CHAT_CLEAR_HISTORY: 'nous.chat/clear-history'
} as const;

// NOUS WebSocket Events - server emission events  
export const NOUSEvents = {
  CHAT_RESPONSE: 'nous.chat/response',
  CHAT_ERROR: 'nous.chat/error',
  AI_RESPONSE: 'nous.ai/response',
  AI_ERROR: 'nous.ai/error',
  CONNECTION_STATUS: 'connection'
} as const;

// Request Schemas
export const ProcessChatInputRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  userId: z.string().min(1, 'User ID is required'),
  context: z.object({
    environmentId: z.string().optional(),
    timestamp: z.number().optional(),
    metadata: z.record(z.unknown()).optional()
  }).optional()
});

export const GenerateResponseRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  context: z.object({
    environmentId: z.string().optional(),
    userId: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  }).optional()
});

export const PingRequestSchema = z.object({
  timestamp: z.number().optional()
});

// Response Schemas
export const ChatResponseSchema = z.object({
  response: z.string(),
  metadata: z.object({
    user_id: z.string().optional(),
    processed_at: z.number(),
    status: z.string(),
    context: z.record(z.unknown()).optional()
  })
});

export const AIResponseSchema = z.object({
  response: z.string(),
  metadata: z.object({
    generated_at: z.number(),
    context: z.record(z.unknown()).optional()
  })
});

export const PongResponseSchema = z.object({
  pong: z.boolean(),
  timestamp: z.number()
});

export const ChatReceiptAcknowledgmentSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.number()
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  timestamp: z.number().optional(),
  details: z.record(z.unknown()).optional()
});

// Type definitions
export type ProcessChatInputRequest = z.infer<typeof ProcessChatInputRequestSchema>;
export type GenerateResponseRequest = z.infer<typeof GenerateResponseRequestSchema>;
export type PingRequest = z.infer<typeof PingRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type PongResponse = z.infer<typeof PongResponseSchema>;
export type ChatReceiptAcknowledgment = z.infer<typeof ChatReceiptAcknowledgmentSchema>;
export type NOUSErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Union types for convenience
export type NOUSRequest = ProcessChatInputRequest | GenerateResponseRequest | PingRequest;
export type NOUSResponse = ChatResponse | AIResponse | PongResponse | ChatReceiptAcknowledgment | NOUSErrorResponse;