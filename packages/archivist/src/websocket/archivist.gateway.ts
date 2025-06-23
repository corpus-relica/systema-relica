import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import customParser from 'socket.io-msgpack-parser';

import { EntityHandlers } from './handlers/entity.handlers';
import { EntityActions } from '@relica/websocket-contracts';
import { FactActions } from '@relica/websocket-contracts';
import { FactHandlers } from './handlers/fact.handlers';
import { KindHandlers } from './handlers/kind.handlers';
import { KindActions } from '@relica/websocket-contracts';
import { LineageHandlers } from './handlers/lineage.handlers';
import { LineageActions } from '@relica/websocket-contracts';
import { QueryHandlers } from './handlers/query.handlers';
import { QueryActions } from '@relica/websocket-contracts';
import { SearchHandlers } from './handlers/search.handlers';
import { SearchActions } from '@relica/websocket-contracts';
import { SpecializationHandlers } from './handlers/specialization.handlers';
import { SpecializationActions } from '@relica/websocket-contracts';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
  parser: customParser,
})
export class ArchivistGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ArchivistGateway.name);

  constructor(
    private readonly entityHandlers: EntityHandlers,
    private readonly factHandlers: FactHandlers,
    private readonly kindHandlers: KindHandlers,
    private readonly lineageHandlers: LineageHandlers,
    private readonly queryHandlers: QueryHandlers,
    private readonly searchHandlers: SearchHandlers,
    private readonly specializationHandlers: SpecializationHandlers,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log(
      'Main Archivist Gateway initialized (connection/health only)',
    );
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection:established', {
      clientId: client.id,
      server: 'archivist',
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // =====================================================
  // PING/HEALTH
  // =====================================================

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  @SubscribeMessage('health')
  handleHealth(@ConnectedSocket() client: Socket) {
    return {
      event: 'health:status',
      data: {
        status: 'healthy',
        service: 'archivist',
        timestamp: Date.now(),
      },
    };
  }

  // =====================================================
  // ENTITY SERVICE
  // =====================================================

  @SubscribeMessage(EntityActions.BATCH_RESOLVE)
  async handleEntityBatchResolve(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${EntityActions.BATCH_RESOLVE} from ${client.id}:`, data);
    const result = await this.entityHandlers.handleEntityBatchResolve(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(EntityActions.CATEGORY_GET)
  async handleEntityCategoryGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${EntityActions.CATEGORY_GET} from ${client.id}:`, data);
    const result = await this.entityHandlers.handleEntityCategoryGet(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(EntityActions.TYPE_GET)
  async handleEntityTypeGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${EntityActions.TYPE_GET} from ${client.id}:`, data);
    const result = await this.entityHandlers.handleEntityTypeGet(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(EntityActions.COLLECTIONS_GET)
  async handleEntityCollectionsGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${EntityActions.COLLECTIONS_GET} from ${client.id}:`, data);
    const result = await this.entityHandlers.handleEntityCollectionsGet(
      data.payload,
      client,
    );
    return result;
  }

  // =====================================================
  // FACT SERVICE
  // =====================================================

  @SubscribeMessage(FactActions.CREATE)
  async handleFactCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.CREATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactCreate(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(FactActions.UPDATE)
  async handleFactUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.UPDATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactUpdate(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(FactActions.DELETE)
  async handleFactDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.DELETE} from ${client.id}`);
    const result = await this.factHandlers.handleFactDelete(
      data.payload,
      client,
    );
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
    const result = await this.factHandlers.handleFactGetDefinitive(
      data.payload,
      client,
    );
    return result.data;
  }

  @SubscribeMessage(FactActions.GET_ALL_RELATED)
  async handleFactGetAllRelated(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const result = await this.factHandlers.handleGetAllRelated(
      data.payload,
      client,
    );
    return result.data;
  }

  @SubscribeMessage(FactActions.GET_SUBTYPES)
  async handleFactGetSubtypes(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.GET_SUBTYPES} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetSubtypes(
      data.payload,
      client,
    );
    console.log('FactGateway.handleFactGetSubtypes after', result.data);
    return result.data;
  }

  @SubscribeMessage(FactActions.GET_SUPERTYPES)
  async handleFactGetSupertypes(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.GET_SUPERTYPES} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetSupertypes(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(FactActions.GET_CLASSIFIED)
  async handleFactGetClassified(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.GET_CLASSIFIED} from ${client.id}`);
    const result = await this.factHandlers.handleFactGetClassified(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(FactActions.VALIDATE)
  async handleFactValidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.VALIDATE} from ${client.id}`);
    const result = await this.factHandlers.handleFactValidate(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(FactActions.BATCH_GET)
  async handleFactBatchGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // this.logger.debug(`Handling ${FactActions.BATCH_GET} from ${client.id}:`, data);
    const result = await this.factHandlers.handleFactBatchGet(
      data.payload,
      client,
    );
    return { success: true, payload: result };
  }

  @SubscribeMessage(FactActions.COUNT)
  async handleFactCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${FactActions.COUNT} from ${client.id}`);
    const result = await this.factHandlers.handleFactCount(
      data.payload,
      client,
    );
    return result;
  }

  // =====================================================
  // KIND SERVICE
  // =====================================================

  @SubscribeMessage(KindActions.LIST)
  async handleKindsListGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${KindActions.LIST} from ${client.id}:`, data);
    const result = await this.kindHandlers.handleKindsList(
      data.payload,
      client,
    );
    return result;
  }

  // =====================================================
  // LINEAGE SERVICE
  // =====================================================

  @SubscribeMessage(LineageActions.GET)
  async handleLineageGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${LineageActions.GET} from ${client.id}:`,
      data,
    );
    const result = await this.lineageHandlers.handleLineageGet(
      data.payload,
      client,
    );
    return { success: true, payload: result };
  }

  // =====================================================
  // QUERY SERVICE
  // =====================================================

  @SubscribeMessage(QueryActions.EXECUTE)
  async handleQueryExecute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${QueryActions.EXECUTE} from ${client.id}:`,
      data.payload,
    );
    const result = await this.queryHandlers.handleQueryExecute(data, client);
    return result;
  }

  @SubscribeMessage(QueryActions.VALIDATE)
  async handleQueryValidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${QueryActions.VALIDATE} from ${client.id}:`,
      data.payload,
    );
    const result = await this.queryHandlers.handleQueryValidate(data, client);
    return result;
  }

  @SubscribeMessage(QueryActions.PARSE)
  async handleQueryParse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${QueryActions.PARSE} from ${client.id}:`,
      data.payload,
    );
    const result = await this.queryHandlers.handleQueryParse(
      data.payload,
      client,
    );
    return result;
  }

  // =====================================================
  // SEARCH SERVICE
  // =====================================================

  @SubscribeMessage(SearchActions.GENERAL)
  async handleSearchGeneral(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${SearchActions.GENERAL} from ${client.id}:`,
      data,
    );
    const result = await this.searchHandlers.handleGeneralSearch(
      data.payload,
      client,
    );
    this.logger.debug(
      `Found ${result.payload.facts.length} search results for ${SearchActions.GENERAL}`,
    );
    return result.payload;
  }

  @SubscribeMessage(SearchActions.INDIVIDUAL)
  async handleSearchIndividual(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${SearchActions.INDIVIDUAL} from ${client.id}:`,
      data.payload,
    );
    const result = await this.searchHandlers.handleIndividualSearch(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(SearchActions.KIND)
  async handleSearchKind(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${SearchActions.KIND} from ${client.id}:`,
      data.payload,
    );
    const result = await this.searchHandlers.handleKindSearch(
      data.payload,
      client,
    );
    return result;
  }

  @SubscribeMessage(SearchActions.EXECUTE)
  async handleSearchExecute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${SearchActions.EXECUTE} from ${client.id}:`,
      data,
    );
    const result = await this.searchHandlers.handleExecuteSearch(data, client);
    return result;
  }

  @SubscribeMessage(SearchActions.UID)
  async handleSearchUid(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(`Handling ${SearchActions.UID} from ${client.id}:`, data);
    const result = await this.searchHandlers.handleUidSearch(
      data.payload,
      client,
    );
    return result;
  }

  // =====================================================
  // SPECIALIZATION SERVICE
  // =====================================================

  @SubscribeMessage(SpecializationActions.SPECIALIZATION_FACT_GET)
  async handleSpecializationFactGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${SpecializationActions.SPECIALIZATION_FACT_GET} from ${client.id}:`,
      data,
    );
    const result =
      await this.specializationHandlers.handleSpecializationFactGet(
        data.payload,
        client,
      );
    return result;
  }

  @SubscribeMessage(SpecializationActions.SPECIALIZATION_HIERARCHY_GET)
  async handleSpecializationHierarchyGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.debug(
      `Handling ${SpecializationActions.SPECIALIZATION_HIERARCHY_GET} from ${client.id}:`,
      data.payloads,
    );
    const result =
      await this.specializationHandlers.handleSpecializationHierarchyGet(
        data.payload,
        client,
      );
    return result;
  }
}
