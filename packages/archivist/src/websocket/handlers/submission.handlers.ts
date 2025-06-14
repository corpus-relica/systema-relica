import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SubmissionService } from '../../submission/submission.service';
import { SubmissionMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class SubmissionHandlers {
  constructor(private readonly submissionService: SubmissionService) {}

  init(gateway: any) {
    gateway.registerHandler('submission:submit', this.handleSubmissionSubmit.bind(this));
    gateway.registerHandler('submission:batch', this.handleSubmissionBatch.bind(this));
  }

  async handleSubmissionSubmit(data: SubmissionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.submissionService.submitFacts(data.facts, data.metadata);
      return {
        event: 'submission:completed',
        data: result
      };
    } catch (error) {
      return {
        event: 'submission:error',
        data: { message: error.message }
      };
    }
  }

  async handleSubmissionBatch(data: SubmissionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.submissionService.batchSubmitFacts(data.facts, data.metadata);
      return {
        event: 'submission:batch:completed',
        data: result
      };
    } catch (error) {
      return {
        event: 'submission:error',
        data: { message: error.message }
      };
    }
  }
}