import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseWebSocketClient } from './PortalSocketClient';
import { ClarityActions } from "@relica/websocket-contracts";

@Injectable()
export class ClaritySocketClient extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, 'clarity', 3001);
  }

  // ClaritySocketClient doesn't need service-specific event handlers

  // =====================================================
  // MODEL OPERATIONS
  // =====================================================

  async getModel(uid: number): Promise<any> {
    const payload = uid ? { uid } : {};
    return this.sendRequestMessage(ClarityActions.MODEL_GET, payload);
  }

  async getModelBatch(uids: string[]): Promise<any> {
    const payload = { uids };
    return this.sendRequestMessage(ClarityActions.MODEL_GET_BATCH, payload);
  }

  async createModel(modelData: {
    name: string;
    type: string;
    data: any;
  }): Promise<any> {
    return this.sendRequestMessage(ClarityActions.MODEL_CREATE, modelData);
  }

  async updateModel(
    modelId: string,
    modelData: { name?: string; type?: string; data?: any }
  ): Promise<any> {
    const payload = { modelId, ...modelData };
    return this.sendRequestMessage(ClarityActions.MODEL_UPDATE, payload);
  }

  // =====================================================
  // KIND OPERATIONS
  // =====================================================

  async getKindModel(uid: string): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(ClarityActions.KIND_GET, payload);
  }

  // =====================================================
  // INDIVIDUAL OPERATIONS
  // =====================================================

  async getIndividualModel(uid: string): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(ClarityActions.INDIVIDUAL_GET, payload);
  }

  // =====================================================
  // ENVIRONMENT OPERATIONS
  // =====================================================

  async getEnvironment(environmentId: string): Promise<any> {
    const payload = { environmentId };
    return this.sendRequestMessage(ClarityActions.ENVIRONMENT_GET, payload);
  }

  // Connection utilities inherited from BaseWebSocketClient
}
