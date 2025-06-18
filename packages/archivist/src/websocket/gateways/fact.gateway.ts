import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { FactHandlers } from '../handlers/fact.handlers';
import { FactActions } from '@relica/websocket-contracts';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class FactGateway {
  private readonly logger = new Logger(FactGateway.name);

  constructor(private readonly factHandlers: FactHandlers) {}

  @SubscribeMessage(FactActions.CREATE)
  async handleFactCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.CREATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactCreate(data, client);
    return result;
  }

  @SubscribeMessage(FactActions.UPDATE)
  async handleFactUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.UPDATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactUpdate(data, client);
    return result;
  }

  @SubscribeMessage(FactActions.DELETE)
  async handleFactDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.DELETE} from ${client.id}`);
    const result = await this.factHandlers.handleFactDelete(data, client);
    return result;
  }

  @SubscribeMessage(FactActions.GET)
  async handleFactGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.GET} from ${client.id}`);
    const result = await this.factHandlers.handleFactGet(data, client);
    return result;
  }

  @SubscribeMessage(FactActions.GET_SUBTYPES)
  async handleFactGetSubtypes(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.GET_SUBTYPES} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetSubtypes(data, client);
    return result;
  }

  @SubscribeMessage(FactActions.GET_SUPERTYPES)
  async handleFactGetSupertypes(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.GET_SUPERTYPES} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetSupertypes(data, client);
    return result;
  }

  @SubscribeMessage(FactActions.GET_CLASSIFIED)
  async handleFactGetClassified(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.GET_CLASSIFIED} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetClassified(data, client);
    return result;
  }

  @SubscribeMessage(FactActions.VALIDATE)
  async handleFactValidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.VALIDATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactValidate(data, client);
    return result;
  }

  @SubscribeMessage(FactActions.BATCH_GET)
  async handleFactBatchGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.BATCH_GET} from ${client.id}:`, data);
    const result = await this.factHandlers.handleFactBatchGet(data, client);
    return {success: true, payload: result};
  }

  @SubscribeMessage(FactActions.COUNT)
  async handleFactCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.COUNT} from ${client.id}`);
    const result = await this.factHandlers.handleFactCount(data, client);
    return result;
  }
}
