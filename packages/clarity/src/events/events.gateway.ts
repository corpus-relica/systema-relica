import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArchivistService } from '../archivist/archivist.service';
import { ModelService } from '../model/model.service';
import { SemanticModelService } from '../services/semantic-model.service';
import { Logger } from '@nestjs/common';
import { ClarityActions } from '@relica/websocket-contracts';
import { toResponse, toErrorResponse, decodeRequest, createServiceBroadcast } from '@relica/websocket-contracts';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class EventsGateway {
  private logger: Logger = new Logger('EventsGateway');

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly modelService: ModelService,
    private readonly semanticModelService: SemanticModelService,
  ) {}

  // Binary serialization methods now provided by shared websocket-contracts utilities

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // You can emit a welcome message or initial data here
    client.emit('connection', { message: 'Successfully connected to server' });
    // Optionally broadcast to other clients that a new client has joined
    createServiceBroadcast(this.server, 'clientJoined', { clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Optionally broadcast to other clients that a client has left
    createServiceBroadcast(this.server, 'clientLeft', { clientId: client.id });
  }

  // SEMANTIC MODEL OPERATIONS //

  @SubscribeMessage(ClarityActions.MODEL_GET)
  async getModel(@MessageBody() rawMessage: any) {
    try {
      const message = decodeRequest(rawMessage);
      const { uid } = message.payload;
      this.logger.log('GET MODEL:', uid);
      const model = await this.semanticModelService.retrieveSemanticModel(uid);
      const response = toResponse(model, message.id);
      return response;
    } catch (error) {
      this.logger.error('Error retrieving model:', error);
      const errorResponse = toErrorResponse(error, rawMessage.id || 'unknown');
      return errorResponse;
    }
  }

  @SubscribeMessage('clarity.model/get-batch')
  async getModels(@MessageBody() message: any) {
    try {
      const { uids } = message.payload;
      this.logger.log('GET MODELS:', uids);
      const models =
        await this.semanticModelService.retrieveSemanticModels(uids);
      return toResponse(models, message.id);
    } catch (error) {
      this.logger.error('Error retrieving models:', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ClarityActions.KIND_GET)
  async getKindModel(@MessageBody() rawMessage: any) {
    try {
      const message = decodeRequest(rawMessage);
      const { uid } = message.payload;
      this.logger.log('GET KIND MODEL:', uid);
      const model = await this.semanticModelService.retrieveSemanticModel(+uid);
      const response = toResponse(model, message.id);
      return response;
    } catch (error) {
      this.logger.error('Error retrieving kind model:', error);
      const errorResponse = toErrorResponse(error, rawMessage.id || 'unknown');
      return errorResponse;
    }
  }

  @SubscribeMessage(ClarityActions.INDIVIDUAL_GET)
  async getIndividualModel(@MessageBody() rawMessage: any) {
    try {
      const message = decodeRequest(rawMessage);
      const { uid } = message.payload;
      const model = await this.semanticModelService.retrieveSemanticModel(+uid);
      return toResponse(model, message.id);
    } catch (error) {
      this.logger.error('Error retrieving individual model:', error);
      return toErrorResponse(error, rawMessage.id || 'unknown');
    }
  }

  @SubscribeMessage('clarity.model/update-definition')
  async updateDefinition(@MessageBody() rawMessage: any) {
    try {
      const message = decodeRequest(rawMessage);
      const { uid, partial_definition, full_definition } = message.payload;
      this.logger.log('UPDATE DEFINITION:', {
        uid,
        partial_definition,
        full_definition,
      });
      const result = await this.modelService.updateDefinition(
        uid,
        partial_definition,
        full_definition,
      );
      const response = toResponse(result, message.id);
      return response;
    } catch (error) {
      this.logger.error('Error updating definition:', error);
      const errorResponse = toErrorResponse(error, rawMessage.id || 'unknown');
      return errorResponse;
    }
  }

  @SubscribeMessage('clarity.model/update-name')
  async updateName(@MessageBody() message: any) {
    try {
      const { uid, name } = message.payload;
      this.logger.log('UPDATE NAME:', { uid, name });
      const result = await this.modelService.updateName(uid, name);
      return toResponse(result, message.id);
    } catch (error) {
      this.logger.error('Error updating name:', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage('clarity.model/update-collection')
  async updateCollection(@MessageBody() message: any) {
    try {
      const { fact_uid, collection_uid, collection_name } = message.payload;
      this.logger.log('UPDATE COLLECTION:', {
        fact_uid,
        collection_uid,
        collection_name,
      });
      const result = await this.modelService.updateCollection(
        fact_uid,
        collection_uid,
        collection_name,
      );
      return toResponse(result, message.id);
    } catch (error) {
      this.logger.error('Error updating collection:', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage('clarity.facts/get-by-entity')
  async getFactsByEntity(@MessageBody() message: any) {
    try {
      const { uid } = message.payload;
      this.logger.log('GET FACTS BY ENTITY:', uid);
      const facts = await this.archivistService.retrieveAllFacts(uid);
      return toResponse(facts, message.id);
    } catch (error) {
      this.logger.error('Error retrieving facts:', error);
      return toErrorResponse(error, message.id);
    }
  }

  // QUINTESSENTIAL MODEL OPERATIONS //

  @SubscribeMessage('clarity.quintessential/get-physical-object')
  async getPhysicalObjectModel(@MessageBody() message: any) {
    try {
      const { uid } = message.payload;
      this.logger.log('GET PHYSICAL OBJECT MODEL:', uid);
      const model = await this.modelService.getPhysicalObjectModel(uid);
      return toResponse(model, message.id);
    } catch (error) {
      this.logger.error('Error retrieving physical object model:', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage('clarity.quintessential/get-aspect')
  async getAspectModel(@MessageBody() message: any) {
    try {
      const { uid } = message.payload;
      this.logger.log('GET ASPECT MODEL:', uid);
      const model = await this.modelService.getAspectModel(uid);
      return toResponse(model, message.id);
    } catch (error) {
      this.logger.error('Error retrieving aspect model:', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage('clarity.quintessential/get-role')
  async getRoleModel(@MessageBody() message: any) {
    try {
      const { uid } = message.payload;
      this.logger.log('GET ROLE MODEL:', uid);
      const model = await this.modelService.getRoleModel(uid);
      return toResponse(model, message.id);
    } catch (error) {
      this.logger.error('Error retrieving role model:', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage('clarity.quintessential/get-relation')
  async getRelationModel(@MessageBody() message: any) {
    try {
      const { uid } = message.payload;
      this.logger.log('GET RELATION MODEL:', uid);
      const model = await this.modelService.getRelationModel(uid);
      return toResponse(model, message.id);
    } catch (error) {
      this.logger.error('Error retrieving relation model:', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage('clarity.quintessential/get-occurrence')
  async getOccurrenceModel(@MessageBody() message: any) {
    try {
      const { uid } = message.payload;
      this.logger.log('GET OCCURRENCE MODEL:', uid);
      const model = await this.modelService.getOccurrenceModel(uid);
      return toResponse(model, message.id);
    } catch (error) {
      this.logger.error('Error retrieving occurrence model:', error);
      return toErrorResponse(error, message.id);
    }
  }
}
