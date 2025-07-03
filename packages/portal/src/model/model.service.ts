import { Injectable, Logger } from "@nestjs/common";
import { ClaritySocketClient } from "@relica/websocket-clients";

@Injectable()
export class ModelService {
  private readonly logger = new Logger(ModelService.name);

  constructor(private readonly clarityClient: ClaritySocketClient) {}

  async getModel(uid: number) {
    try {
      return await this.clarityClient.getModel(uid);
    } catch (error) {
      this.logger.error(`Failed to get model for uid ${uid}:`, error);
      throw error;
    }
  }

  async getKindModel(uid: number) {
    try {
      return await this.clarityClient.getKindModel(uid);
    } catch (error) {
      this.logger.error(`Failed to get kind model for uid ${uid}:`, error);
      throw error;
    }
  }

  async getIndividualModel(uid: string) {
    try {
      return await this.clarityClient.getIndividualModel(uid);
    } catch (error) {
      this.logger.error(
        `Failed to get individual model for uid ${uid}:`,
        error
      );
      throw error;
    }
  }
}
