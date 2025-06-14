import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { TransactionService } from '../../transaction/transaction.service';
import { TransactionMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class TransactionHandlers {
  constructor(private readonly transactionService: TransactionService) {}

  init(gateway: any) {
    gateway.registerHandler('transaction:start', this.handleTransactionStart.bind(this));
    gateway.registerHandler('transaction:commit', this.handleTransactionCommit.bind(this));
    gateway.registerHandler('transaction:rollback', this.handleTransactionRollback.bind(this));
    gateway.registerHandler('transaction:get', this.handleTransactionGet.bind(this));
  }

  async handleTransactionStart(data: TransactionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.transactionService.startTransaction();
      return {
        event: 'transaction:started',
        data: result
      };
    } catch (error) {
      return {
        event: 'transaction:error',
        data: { message: error.message }
      };
    }
  }

  async handleTransactionCommit(data: TransactionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.transactionService.commitTransaction(data.transaction_id);
      return {
        event: 'transaction:committed',
        data: result
      };
    } catch (error) {
      return {
        event: 'transaction:error',
        data: { message: error.message }
      };
    }
  }

  async handleTransactionRollback(data: TransactionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.transactionService.rollbackTransaction(data.transaction_id);
      return {
        event: 'transaction:rolledback',
        data: result
      };
    } catch (error) {
      return {
        event: 'transaction:error',
        data: { message: error.message }
      };
    }
  }

  async handleTransactionGet(data: TransactionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.transactionService.getTransaction(data.transaction_id);
      return {
        event: 'transaction:retrieved',
        data: result
      };
    } catch (error) {
      return {
        event: 'transaction:error',
        data: { message: error.message }
      };
    }
  }
}