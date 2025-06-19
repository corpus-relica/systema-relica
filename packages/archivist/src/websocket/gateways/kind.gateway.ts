import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { KindHandlers } from '../handlers/kind.handlers';
import { KindActions } from '@relica/websocket-contracts';
import customParser from 'socket.io-msgpack-parser';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
  parser: customParser
})
export class KindGateway {
  private readonly logger = new Logger(KindGateway.name);

  constructor(private readonly kindHandlers: KindHandlers) {}

  @SubscribeMessage(KindActions.LIST)
  async handleKindsListGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${KindActions.LIST} from ${client.id}:`, data);
    const result = await this.kindHandlers.handleKindsList(data, client);
    return result
  }
}
