import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { CompletionService } from '../../completion/completion.service';
import { CompletionMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class CompletionHandlers {
  constructor(private readonly completionService: CompletionService) {}

  init(gateway: any) {
    gateway.registerHandler('completion:request', this.handleCompletion.bind(this));
    gateway.registerHandler('completion:entities', this.handleEntityCompletion.bind(this));
    gateway.registerHandler('completion:relations', this.handleRelationCompletion.bind(this));
  }

  async handleCompletion(data: CompletionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.completionService.getCompletions(data.query, data.context);
      return {
        event: 'completion:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'completion:error',
        data: { message: error.message }
      };
    }
  }

  async handleEntityCompletion(data: CompletionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.completionService.getEntityCompletions(data.query);
      return {
        event: 'completion:entities:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'completion:error',
        data: { message: error.message }
      };
    }
  }

  async handleRelationCompletion(data: CompletionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.completionService.getRelationCompletions(data.query);
      return {
        event: 'completion:relations:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'completion:error',
        data: { message: error.message }
      };
    }
  }
}