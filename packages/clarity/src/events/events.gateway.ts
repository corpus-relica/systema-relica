import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArchivistService } from '../archivist/archivist.service';
import { ModelService } from '../model/model.service';
import { Logger } from '@nestjs/common';
import { ClarityActions } from '@relica/websocket-contracts';
import customParser from 'socket.io-msgpack-parser';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
  parser: customParser,
})
export class EventsGateway {
  private logger: Logger = new Logger('EventsGateway');

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly modelService: ModelService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // You can emit a welcome message or initial data here
    client.emit('connection', { message: 'Successfully connected to server' });
    // Optionally broadcast to other clients that a new client has joined
    client.broadcast.emit('clientJoined', { clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Optionally broadcast to other clients that a client has left
    this.server.emit('clientLeft', { clientId: client.id });
  }

  // SEMANTIC MODEL OPERATIONS //

  @SubscribeMessage(ClarityActions.MODEL_GET)
  async getModel(@MessageBody('payload') payload: any): Promise<any> {
    this.logger.log('GET MODEL:', payload.uid);
    try {
      const model = await this.modelService.retrieveModel(+payload.uid);
      console.log('Retrieved model:', model);
      return { success: true, data: model };
    } catch (error) {
      this.logger.error('Error retrieving model:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.model/get-batch')
  async getModels(@MessageBody('uids') uids: number[]): Promise<any> {
    this.logger.log('GET MODELS:', uids);
    try {
      const models = await this.modelService.retrieveModels(uids);
      return { success: true, data: models };
    } catch (error) {
      this.logger.error('Error retrieving models:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.kind/get')
  async getKindModel(@MessageBody('uid') uid: number): Promise<any> {
    this.logger.log('GET KIND MODEL:', uid);
    try {
      const model = await this.modelService.retrieveKindModel(uid);
      return { success: true, data: model };
    } catch (error) {
      this.logger.error('Error retrieving kind model:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.individual/get')
  async getIndividualModel(@MessageBody('uid') uid: number): Promise<any> {
    this.logger.log('GET INDIVIDUAL MODEL:', uid);
    try {
      const model = await this.modelService.retrieveIndividualModel(uid);
      return { success: true, data: model };
    } catch (error) {
      this.logger.error('Error retrieving individual model:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.model/update-definition')
  async updateDefinition(
    @MessageBody()
    data: {
      uid: number;
      partial_definition: string;
      full_definition: string;
    },
  ): Promise<any> {
    this.logger.log('UPDATE DEFINITION:', data);
    try {
      const result = await this.modelService.updateDefinition(
        data.uid,
        data.partial_definition,
        data.full_definition,
      );
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Error updating definition:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.model/update-name')
  async updateName(
    @MessageBody() data: { uid: number; name: string },
  ): Promise<any> {
    this.logger.log('UPDATE NAME:', data);
    try {
      const result = await this.modelService.updateName(data.uid, data.name);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Error updating name:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.model/update-collection')
  async updateCollection(
    @MessageBody()
    data: {
      fact_uid: number;
      collection_uid: number;
      collection_name: string;
    },
  ): Promise<any> {
    this.logger.log('UPDATE COLLECTION:', data);
    try {
      const result = await this.modelService.updateCollection(
        data.fact_uid,
        data.collection_uid,
        data.collection_name,
      );
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Error updating collection:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.facts/get-by-entity')
  async getFactsByEntity(@MessageBody('uid') uid: number): Promise<any> {
    this.logger.log('GET FACTS BY ENTITY:', uid);
    try {
      const facts = await this.archivistService.retrieveAllFacts(uid);
      return { success: true, data: facts };
    } catch (error) {
      this.logger.error('Error retrieving facts:', error);
      return { success: false, error: error.message };
    }
  }

  // QUINTESSENTIAL MODEL OPERATIONS //

  @SubscribeMessage('clarity.quintessential/get-physical-object')
  async getPhysicalObjectModel(@MessageBody('uid') uid: number): Promise<any> {
    this.logger.log('GET PHYSICAL OBJECT MODEL:', uid);
    try {
      const model = await this.modelService.getPhysicalObjectModel(uid);
      return { success: true, data: model };
    } catch (error) {
      this.logger.error('Error retrieving physical object model:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.quintessential/get-aspect')
  async getAspectModel(@MessageBody('uid') uid: number): Promise<any> {
    this.logger.log('GET ASPECT MODEL:', uid);
    try {
      const model = await this.modelService.getAspectModel(uid);
      return { success: true, data: model };
    } catch (error) {
      this.logger.error('Error retrieving aspect model:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.quintessential/get-role')
  async getRoleModel(@MessageBody('uid') uid: number): Promise<any> {
    this.logger.log('GET ROLE MODEL:', uid);
    try {
      const model = await this.modelService.getRoleModel(uid);
      return { success: true, data: model };
    } catch (error) {
      this.logger.error('Error retrieving role model:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.quintessential/get-relation')
  async getRelationModel(@MessageBody('uid') uid: number): Promise<any> {
    this.logger.log('GET RELATION MODEL:', uid);
    try {
      const model = await this.modelService.getRelationModel(uid);
      return { success: true, data: model };
    } catch (error) {
      this.logger.error('Error retrieving relation model:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('clarity.quintessential/get-occurrence')
  async getOccurrenceModel(@MessageBody('uid') uid: number): Promise<any> {
    this.logger.log('GET OCCURRENCE MODEL:', uid);
    try {
      const model = await this.modelService.getOccurrenceModel(uid);
      return { success: true, data: model };
    } catch (error) {
      this.logger.error('Error retrieving occurrence model:', error);
      return { success: false, error: error.message };
    }
  }
}
