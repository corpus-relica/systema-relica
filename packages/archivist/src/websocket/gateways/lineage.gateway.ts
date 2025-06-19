import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LineageHandlers } from '../handlers/lineage.handlers';
import { LineageActions } from '@relica/websocket-contracts';
import customParser from 'socket.io-msgpack-parser';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
  parser: customParser
})
export class LineageGateway {
  private readonly logger = new Logger(LineageGateway.name);

  constructor(private readonly lineageHandlers: LineageHandlers) {}

  @SubscribeMessage(LineageActions.GET)
  async handleLineageGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${LineageActions.GET} from ${client.id}:`, data);
    const result = await this.lineageHandlers.handleLineageGet(data, client);
    return {success: true, payload:result};
  }
}
