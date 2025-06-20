import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EntityHandlers } from '../handlers/entity.handlers';
import { EntityActions } from '@relica/websocket-contracts';
import customParser from 'socket.io-msgpack-parser';

@Injectable()
@WebSocketGateway()
// @WebSocketGateway({
//   cors: {
//     origin: '*',
//   },
//   transports: ['websocket'],
//   parser: customParser
// })
export class EntityGateway {
  private readonly logger = new Logger(EntityGateway.name);

  constructor(private readonly entityHandlers: EntityHandlers) {}

  afterInit(server: Server) {
    this.logger.log('entity gateway initialized');
  }

  @SubscribeMessage(EntityActions.BATCH_RESOLVE)
  async handleEntityBatchResolve(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${EntityActions.BATCH_RESOLVE} from ${client.id}:`, data);
    const result = await this.entityHandlers.handleEntityBatchResolve(data.payload, client);
    return result;
  }

  @SubscribeMessage(EntityActions.CATEGORY_GET)
  async handleEntityCategoryGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${EntityActions.CATEGORY_GET} from ${client.id}:`, data);
    const result = await this.entityHandlers.handleEntityCategoryGet(data.payload, client);
    return result;
  }

  @SubscribeMessage(EntityActions.TYPE_GET)
  async handleEntityTypeGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${EntityActions.TYPE_GET} from ${client.id}:`, data);
    const result = await this.entityHandlers.handleEntityTypeGet(data.payload, client);
    return result;
  }

  @SubscribeMessage(EntityActions.COLLECTIONS_GET)
  async handleEntityCollectionsGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${EntityActions.COLLECTIONS_GET} from ${client.id}:`, data);
    const result = await this.entityHandlers.handleEntityCollectionsGet(data.payload, client);
    return result;
  }
}
