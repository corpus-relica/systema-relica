import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseWebSocketClient } from "./BaseWebSocketClient";
import {
  NOUSActions,
  NOUSEvents,
  ProcessChatInputRequest,
  GenerateResponseRequest,
  PingRequest,
  ChatResponse,
  AIResponse,
  PongResponse,
  ChatReceiptAcknowledgment,
} from "@relica/websocket-contracts";

@Injectable()
export class NOUSSocketClient extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, "nous", 3006);
  }

  protected setupServiceSpecificEventHandlers(): void {
    if (!this.socket) return;

    // Forward NOUS events to registered handlers
    this.socket.on(NOUSEvents.CHAT_RESPONSE, (payload) => {
      this.emitToHandlers(NOUSEvents.CHAT_RESPONSE, payload);
    });

    this.socket.on(NOUSEvents.CHAT_ERROR, (payload) => {
      this.emitToHandlers(NOUSEvents.CHAT_ERROR, payload);
    });

    this.socket.on(NOUSEvents.AI_RESPONSE, (payload) => {
      console.log("DADASDSADADSADSADS");
      this.emitToHandlers(NOUSEvents.AI_RESPONSE, payload);
    });

    this.socket.on(NOUSEvents.AI_ERROR, (payload) => {
      this.emitToHandlers(NOUSEvents.AI_ERROR, payload);
    });

    this.socket.on(NOUSEvents.CONNECTION_STATUS, (payload) => {
      this.emitToHandlers(NOUSEvents.CONNECTION_STATUS, payload);
    });
  }

  // =====================================================
  // CHAT OPERATIONS
  // =====================================================

  /**
   * Process chat input and return receipt acknowledgment
   * The actual AI response will come via the nous.chat/response event
   * @param message User message
   * @param userId User identifier
   * @param context Optional context including environmentId
   * @returns Promise<ChatReceiptAcknowledgment>
   */
  async processChatInput(
    message: string,
    userId: string,
    context?: {
      environmentId?: string;
      timestamp?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ChatReceiptAcknowledgment> {
    const payload: ProcessChatInputRequest = {
      message,
      userId,
      context,
    };

    return this.sendRequestMessage(NOUSActions.CHAT_PROCESS_INPUT, payload);
  }

  /**
   * Generate AI response for a given prompt
   * @param prompt The prompt to process
   * @param context Optional context
   * @returns Promise<AIResponse>
   */
  async generateResponse(
    prompt: string,
    context?: {
      environmentId?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AIResponse> {
    const payload: GenerateResponseRequest = {
      prompt,
      context,
    };

    return this.sendRequestMessage(NOUSActions.AI_GENERATE_RESPONSE, payload);
  }

  // =====================================================
  // SYSTEM OPERATIONS
  // =====================================================

  /**
   * Send ping to check connection and get pong response
   * @param timestamp Optional timestamp
   * @returns Promise<PongResponse>
   */
  async ping(timestamp?: number): Promise<PongResponse> {
    const payload: PingRequest = {
      timestamp: timestamp || Date.now(),
    };

    return this.sendRequestMessage(NOUSActions.SYSTEM_PING, payload);
  }

  /**
   * Clear chat history for a user (if supported by server)
   * @param userId User identifier
   * @returns Promise<any>
   */
  async clearChatHistory(userId: string): Promise<any> {
    const payload = { userId };

    return this.sendRequestMessage(NOUSActions.CHAT_CLEAR_HISTORY, payload);
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Check if NOUS service is available and responding
   * @returns Promise<boolean>
   */
  async isServiceHealthy(): Promise<boolean> {
    try {
      const response = await this.ping();
      return response.pong === true;
    } catch (error) {
      this.logger.error("NOUS health check failed:", error);
      return false;
    }
  }

  /**
   * Get service connection information
   * @returns Object with connection details
   */
  getConnectionInfo() {
    return {
      serviceName: this.serviceName,
      isConnected: this.isConnected(),
      sid: this.socket?.id,
    };
  }
}
