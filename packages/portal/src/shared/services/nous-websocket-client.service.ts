import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { NOUSSocketClient } from "@relica/websocket-clients";
import {
  NOUSEvents,
  PortalSystemEvents,
  type ChatResponse,
  type AIResponse,
  type PongResponse,
  type ChatReceiptAcknowledgment,
} from "@relica/websocket-contracts";

@Injectable()
export class NousWebSocketClientService implements OnModuleInit {
  private readonly logger = new Logger(NousWebSocketClientService.name);
  private portalGateway: any; // Will be injected after initialization to avoid circular dependency

  constructor(private readonly nousClient: NOUSSocketClient) {}

  async onModuleInit() {
    // Set up event forwarding from NOUS to Portal
    this.nousClient.on(NOUSEvents.CHAT_RESPONSE, (payload) => {
      this.logger.debug("Received nous.chat/response event");
      console.log(payload);
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Forward the event to the Portal Gateway for broadcast to frontend clients
      this.portalGateway.server.emit(
        PortalSystemEvents.NOUS_CHAT_RESPONSE,
        payload
      );
    });

    this.nousClient.on(NOUSEvents.CHAT_ERROR, (payload) => {
      this.logger.debug("Received nous.chat/error event");
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Forward error events to frontend clients
      this.portalGateway.server.emit(
        PortalSystemEvents.NOUS_CHAT_ERROR,
        payload
      );
    });

    this.nousClient.on(NOUSEvents.AI_RESPONSE, (payload) => {
      this.logger.debug("Received nous.ai/response event");
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Forward AI response events to frontend clients
      this.portalGateway.server.emit(
        PortalSystemEvents.NOUS_AI_RESPONSE,
        payload
      );
    });

    this.nousClient.on(NOUSEvents.AI_ERROR, (payload) => {
      this.logger.debug("Received nous.ai/error event");
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Forward AI error events to frontend clients
      this.portalGateway.server.emit(PortalSystemEvents.NOUS_AI_ERROR, payload);
    });

    this.nousClient.on(NOUSEvents.CONNECTION_STATUS, (payload) => {
      this.logger.debug("Received nous connection status event");
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Forward connection status events to frontend clients
      this.portalGateway.server.emit(
        PortalSystemEvents.NOUS_CONNECTION_STATUS,
        payload
      );
    });
  }

  setPortalGateway(gateway: any) {
    this.portalGateway = gateway;
  }

  // Delegate all methods to the shared NOUSSocketClient
  async processChatInput(
    message: string,
    userId: number,
    context?: {
      environmentId?: string;
      timestamp?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ChatReceiptAcknowledgment> {
    try {
      const result = await this.nousClient.processChatInput(
        message,
        userId.toString(),
        context
      );
      // This returns only the receipt acknowledgment
      // The actual AI response will come via event forwarding (nous.chat/response)
      return result;
    } catch (error) {
      this.logger.error("Failed to process chat input:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to process chat input"
      );
    }
  }

  async generateResponse(
    prompt: string,
    context?: {
      environmentId?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AIResponse> {
    try {
      const result = await this.nousClient.generateResponse(prompt, context);
      return result;
    } catch (error) {
      this.logger.error("Failed to generate response:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate response"
      );
    }
  }

  async ping(timestamp?: number): Promise<PongResponse> {
    try {
      const result = await this.nousClient.ping(timestamp);
      return result;
    } catch (error) {
      this.logger.error("Failed to ping NOUS service:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to ping NOUS service"
      );
    }
  }

  async clearChatHistory(userId: string): Promise<any> {
    try {
      const result = await this.nousClient.clearChatHistory(userId);
      return result;
    } catch (error) {
      this.logger.error("Failed to clear chat history:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to clear chat history"
      );
    }
  }

  // Utility methods
  async isServiceHealthy(): Promise<boolean> {
    return this.nousClient.isServiceHealthy();
  }

  getConnectionInfo() {
    return this.nousClient.getConnectionInfo();
  }
}
