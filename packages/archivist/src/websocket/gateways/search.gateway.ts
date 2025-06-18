import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SearchHandlers } from '../handlers/search.handlers';
import { SearchActions } from '@relica/websocket-contracts';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class SearchGateway {
  private readonly logger = new Logger(SearchGateway.name);

  constructor(private readonly searchHandlers: SearchHandlers) {}

  @SubscribeMessage(SearchActions.GENERAL)
  async handleSearchGeneral(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${SearchActions.GENERAL} from ${client.id}:`, data);
    const result = await this.searchHandlers.handleGeneralSearch(data, client);
    return result;
  }

  @SubscribeMessage(SearchActions.INDIVIDUAL)
  async handleSearchIndividual(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${SearchActions.INDIVIDUAL} from ${client.id}:`, data);
    const result = await this.searchHandlers.handleIndividualSearch(data, client);
    return result;
  }

  @SubscribeMessage(SearchActions.KIND)
  async handleSearchKind(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${SearchActions.KIND} from ${client.id}:`, data);
    const result = await this.searchHandlers.handleKindSearch(data, client);
    return result;
  }

  @SubscribeMessage(SearchActions.EXECUTE)
  async handleSearchExecute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${SearchActions.EXECUTE} from ${client.id}:`, data);
    const result = await this.searchHandlers.handleExecuteSearch(data, client);
    return result;
  }

  @SubscribeMessage(SearchActions.UID)
  async handleSearchUid(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${SearchActions.UID} from ${client.id}:`, data);
    const result = await this.searchHandlers.handleUidSearch(data, client);
    return result;
  }
}