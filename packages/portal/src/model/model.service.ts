import { Injectable, Logger } from '@nestjs/common';
import { ClaritySocketClient } from '@relica/websocket-clients';
import { decodePayload } from '@relica/websocket-contracts';

@Injectable()
export class ModelService {
  private readonly logger = new Logger(ModelService.name);
  
  constructor(private readonly clarityClient: ClaritySocketClient) {}

  async getModel(uid: number) {
    try {
      const binaryResponse = await this.clarityClient.getModel(uid);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get model for uid ${uid}:`, error);
      throw error;
    }
  }

  async getKindModel(uid: number) {
    try {
      const binaryResponse = await this.clarityClient.getKindModel(uid);
      console.log('get kind binaryResponse:', decodePayload(binaryResponse));
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get kind model for uid ${uid}:`, error);
      throw error;
    }
  }

  async getIndividualModel(uid: string) {
    try {
      const binaryResponse = await this.clarityClient.getIndividualModel(uid);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get individual model for uid ${uid}:`, error);
      throw error;
    }
  }
}
