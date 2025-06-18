import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { QueryHandlers } from '../handlers/query.handlers';
import { QueryActions } from '@relica/websocket-contracts';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class QueryGateway {
  private readonly logger = new Logger(QueryGateway.name);

  constructor(private readonly queryHandlers: QueryHandlers) {}

  @SubscribeMessage(QueryActions.EXECUTE)
  async handleQueryExecute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${QueryActions.EXECUTE} from ${client.id}:`, data);
    const result = await this.queryHandlers.handleQueryExecute(data, client);
    return result;
  }

  @SubscribeMessage(QueryActions.VALIDATE)
  async handleQueryValidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${QueryActions.VALIDATE} from ${client.id}:`, data);
    const result = await this.queryHandlers.handleQueryValidate(data, client);
    return result;
  }

  @SubscribeMessage(QueryActions.PARSE)
  async handleQueryParse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${QueryActions.PARSE} from ${client.id}:`, data);
    const result = await this.queryHandlers.handleQueryParse(data, client);
    return result;
  }
}