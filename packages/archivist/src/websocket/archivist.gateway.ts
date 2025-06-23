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
import { toResponse, toErrorResponse } from './utils/response.utils';

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
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.entityHandlers.handleEntityBatchResolve(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(EntityActions.CATEGORY_GET)
  async handleEntityCategoryGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.entityHandlers.handleEntityCategoryGet(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(EntityActions.TYPE_GET)
  async handleEntityTypeGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.entityHandlers.handleEntityTypeGet(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(EntityActions.COLLECTIONS_GET)
  async handleEntityCollectionsGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.entityHandlers.handleEntityCollectionsGet(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  // =====================================================
  // FACT SERVICE
  // =====================================================

  @SubscribeMessage(FactActions.CREATE)
  async handleFactCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleFactCreate(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.UPDATE)
  async handleFactUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleFactUpdate(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.DELETE)
  async handleFactDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleFactDelete(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.GET)
  async handleFactGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(`Handling ${FactActions.GET} from ${client.id}`);
      const result = await this.factHandlers.handleFactGet(message.payload, client);
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.GET_DEFINITIVE)
  async handleFactGetDefinitive(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleFactGetDefinitive(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.GET_ALL_RELATED)
  async handleFactGetAllRelated(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleGetAllRelated(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.GET_SUBTYPES)
  async handleFactGetSubtypes(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(`Handling ${FactActions.GET_SUBTYPES} from ${client.id}`);
      const result = await this.factHandlers.handleFactGetSubtypes(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.GET_SUPERTYPES)
  async handleFactGetSupertypes(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleFactGetSupertypes(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.GET_CLASSIFIED)
  async handleFactGetClassified(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleFactGetClassified(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.VALIDATE)
  async handleFactValidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleFactValidate(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.BATCH_GET)
  async handleFactBatchGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      const result = await this.factHandlers.handleFactBatchGet(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(FactActions.COUNT)
  async handleFactCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(`Handling ${FactActions.COUNT} from ${client.id}`);
      const result = await this.factHandlers.handleFactCount(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  // =====================================================
  // KIND SERVICE
  // =====================================================

  @SubscribeMessage(KindActions.LIST)
  async handleKindsListGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(`Handling ${KindActions.LIST} from ${client.id}:`, message);
      const result = await this.kindHandlers.handleKindsList(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  // =====================================================
  // LINEAGE SERVICE
  // =====================================================

  @SubscribeMessage(LineageActions.GET)
  async handleLineageGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${LineageActions.GET} from ${client.id}:`,
        message,
      );
      const result = await this.lineageHandlers.handleLineageGet(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  // =====================================================
  // QUERY SERVICE
  // =====================================================

  @SubscribeMessage(QueryActions.EXECUTE)
  async handleQueryExecute(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${QueryActions.EXECUTE} from ${client.id}:`,
        message.payload,
      );
      const result = await this.queryHandlers.handleQueryExecute(message, client);
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(QueryActions.VALIDATE)
  async handleQueryValidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${QueryActions.VALIDATE} from ${client.id}:`,
        message.payload,
      );
      const result = await this.queryHandlers.handleQueryValidate(message, client);
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(QueryActions.PARSE)
  async handleQueryParse(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${QueryActions.PARSE} from ${client.id}:`,
        message.payload,
      );
      const result = await this.queryHandlers.handleQueryParse(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  // =====================================================
  // SEARCH SERVICE
  // =====================================================

  @SubscribeMessage(SearchActions.GENERAL)
  async handleSearchGeneral(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${SearchActions.GENERAL} from ${client.id}:`,
        message,
      );
      const result = await this.searchHandlers.handleGeneralSearch(
        message.payload,
        client,
      );
      this.logger.debug(
        `Found ${result.facts.length} search results for ${SearchActions.GENERAL}`,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(SearchActions.INDIVIDUAL)
  async handleSearchIndividual(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${SearchActions.INDIVIDUAL} from ${client.id}:`,
        message.payload,
      );
      const result = await this.searchHandlers.handleIndividualSearch(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(SearchActions.KIND)
  async handleSearchKind(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${SearchActions.KIND} from ${client.id}:`,
        message.payload,
      );
      const result = await this.searchHandlers.handleKindSearch(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(SearchActions.EXECUTE)
  async handleSearchExecute(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${SearchActions.EXECUTE} from ${client.id}:`,
        message,
      );
      const result = await this.searchHandlers.handleExecuteSearch(message, client);
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(SearchActions.UID)
  async handleSearchUid(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(`Handling ${SearchActions.UID} from ${client.id}:`, message);
      const result = await this.searchHandlers.handleUidSearch(
        message.payload,
        client,
      );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  // =====================================================
  // SPECIALIZATION SERVICE
  // =====================================================

  @SubscribeMessage(SpecializationActions.SPECIALIZATION_FACT_GET)
  async handleSpecializationFactGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${SpecializationActions.SPECIALIZATION_FACT_GET} from ${client.id}:`,
        message,
      );
      const result =
        await this.specializationHandlers.handleSpecializationFactGet(
          message.payload,
          client,
        );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(SpecializationActions.SPECIALIZATION_HIERARCHY_GET)
  async handleSpecializationHierarchyGet(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any,
  ) {
    try {
      this.logger.debug(
        `Handling ${SpecializationActions.SPECIALIZATION_HIERARCHY_GET} from ${client.id}:`,
        message.payload,
      );
      const result =
        await this.specializationHandlers.handleSpecializationHierarchyGet(
          message.payload,
          client,
        );
      return toResponse(result, message.id);
    } catch (error) {
      return toErrorResponse(error, message.id);
    }
  }
}
