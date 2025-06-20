import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SpecializationHandlers } from '../handlers/specialization.handlers';
import { SpecializationActions } from '@relica/websocket-contracts';
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
export class SpecializationGateway {
  private readonly logger = new Logger(SpecializationGateway.name);

  constructor(private readonly specializationHandlers: SpecializationHandlers) {}

  afterInit(server: Server) {
    this.logger.log('specialization gateway initialized');
  }
  @SubscribeMessage(SpecializationActions.SPECIALIZATION_FACT_GET)
  async handleSpecializationFactGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${SpecializationActions.SPECIALIZATION_FACT_GET} from ${client.id}:`, data);
    const result = await this.specializationHandlers.handleSpecializationFactGet(data, client);
    return result;
  }

  @SubscribeMessage(SpecializationActions.SPECIALIZATION_HIERARCHY_GET)
  async handleSpecializationHierarchyGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${SpecializationActions.SPECIALIZATION_HIERARCHY_GET} from ${client.id}:`, data);
    const result = await this.specializationHandlers.handleSpecializationHierarchyGet(data.payload, client);
    return result;
  }
}
