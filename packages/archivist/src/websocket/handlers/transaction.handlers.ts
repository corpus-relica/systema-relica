import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { TransactionService } from '../../transaction/transaction.service';
import { TransactionMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class TransactionHandlers {
  constructor(private readonly transactionService: TransactionService) {}

  async handleTransactionStart(data: TransactionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = this.transactionService.startMachine('default');
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
      const result = this.transactionService.sendEvent({ type: 'COMMIT', transactionId: data.transaction_id });
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
      const result = this.transactionService.sendEvent({ type: 'ROLLBACK', transactionId: data.transaction_id });
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
      const result = this.transactionService.getSnapshot();
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
