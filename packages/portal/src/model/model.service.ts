import { Injectable } from '@nestjs/common';
import { ClaritySocketClient } from '@relica/websocket-clients';

@Injectable()
export class ModelService {
  constructor(private readonly clarityClient: ClaritySocketClient) {}

  async getModel(uid: number) {
    return this.clarityClient.getModel(uid);
  }

  async getKindModel(uid: number) {
    return this.clarityClient.getKindModel(uid);
  }

  async getIndividualModel(uid: string) {
    return this.clarityClient.getIndividualModel(uid);
  }
}