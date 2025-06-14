import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ValidationService } from '../../validation/validation.service';
import { ValidationMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class ValidationHandlers {
  constructor(private readonly validationService: ValidationService) {}

  init(gateway: any) {
    gateway.registerHandler('validation:validate', this.handleValidation.bind(this));
    gateway.registerHandler('validation:collection', this.handleCollectionValidation.bind(this));
  }

  async handleValidation(data: ValidationMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.validationService.simpleValidateBinaryFact(data.fact);
      return {
        event: 'validation:result',
        data: result
      };
    } catch (error) {
      return {
        event: 'validation:error',
        data: { message: error.message }
      };
    }
  }

  async handleCollectionValidation(data: { facts: ValidationMessage['fact'][] }, client: Socket): Promise<WsResponse> {
    try {
      const results = await Promise.all(
        data.facts.map(fact => this.validationService.simpleValidateBinaryFact(fact))
      );
      return {
        event: 'validation:collection:result',
        data: results
      };
    } catch (error) {
      return {
        event: 'validation:error',
        data: { message: error.message }
      };
    }
  }
}