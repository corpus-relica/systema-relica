import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SubmissionService } from '../../submission/submission.service';
import { SubmissionMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class SubmissionHandlers {
  constructor(private readonly submissionService: SubmissionService) {}

  async handleSubmissionSubmit(data: SubmissionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.submissionService.submitBinaryFacts(data.facts);
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
      const result = await this.submissionService.submitBinaryFacts(data.facts);
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
