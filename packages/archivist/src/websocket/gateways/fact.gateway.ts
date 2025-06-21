import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { FactHandlers } from '../handlers/fact.handlers';
import { FactActions } from '@relica/websocket-contracts';
import customParser from 'socket.io-msgpack-parser';

@Injectable()
// @WebSocketGateway({
//   cors: {
//     origin: '*',
//   },
//   transports: ['websocket'],
//   parser: customParser
// })
@WebSocketGateway()
export class FactGateway {
  private readonly logger = new Logger(FactGateway.name);

  constructor(private readonly factHandlers: FactHandlers) {}

  afterInit(server: Server) {
    this.logger.log('fact gateway initialized');
  }
  @SubscribeMessage(FactActions.CREATE)
  async handleFactCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.CREATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactCreate(data.payload, client);
    return result;
  }

  @SubscribeMessage(FactActions.UPDATE)
  async handleFactUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.UPDATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactUpdate(data.payload, client);
    return result;
  }

  @SubscribeMessage(FactActions.DELETE)
  async handleFactDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.DELETE} from ${client.id}`);
    const result = await this.factHandlers.handleFactDelete(data.payload, client);
    return result;
  }

  @SubscribeMessage(FactActions.GET)
  async handleFactGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.GET} from ${client.id}`);
    console.log('FactGateway.handleFactGet fore', data.payload);
    const result = await this.factHandlers.handleFactGet(data.payload, client);
    console.log('FactGateway.handleFactGet after', result);
    return result.data;
  }

  @SubscribeMessage(FactActions.GET_DEFINITIVE)
  async handleFactGetDefinitive(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.GET} from ${client.id}`);
    console.log('FactGateway.handleFactGetDefinitive fore', data.payload);
    const result = await this.factHandlers.handleFactGetDefinitive(data.payload, client);
    console.log('FactGateway.handleFactGetDefinitive after', result);
    return result.data;
  }

  @SubscribeMessage(FactActions.GET_SUBTYPES)
  async handleFactGetSubtypes(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.GET_SUBTYPES} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetSubtypes(data.payload, client);
    return result;
  }

  @SubscribeMessage(FactActions.GET_SUPERTYPES)
  async handleFactGetSupertypes(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.GET_SUPERTYPES} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetSupertypes(data.payload, client);
    return result;
  }

  @SubscribeMessage(FactActions.GET_CLASSIFIED)
  async handleFactGetClassified(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.GET_CLASSIFIED} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetClassified(data.payload, client);
    return result;
  }

  @SubscribeMessage(FactActions.VALIDATE)
  async handleFactValidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.VALIDATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactValidate(data.payload, client);
    return result;
  }

  @SubscribeMessage(FactActions.BATCH_GET)
  async handleFactBatchGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.BATCH_GET} from ${client.id}:`, data);
    const result = await this.factHandlers.handleFactBatchGet(data.payload, client);
    return {success: true, payload: result};
  }

  @SubscribeMessage(FactActions.COUNT)
  async handleFactCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.COUNT} from ${client.id}`);
    const result = await this.factHandlers.handleFactCount(data.payload, client);
    return result;
  }
}
