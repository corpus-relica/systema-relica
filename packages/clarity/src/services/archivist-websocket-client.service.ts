import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import {
  FactActions,
  SearchActions,
  ConceptActions,
  SubmissionActions,
  DefinitionActions,
  ContractUtils,
  type FactCreateRequest,
  type FactGetRequest,
  type FactDeleteRequest,
  type SearchGeneralRequest,
  type ConceptGetRequest,
  type ConceptDeleteRequest,
  type SubmissionSubmitRequest,
  type DefinitionUpdateRequest
} from '@relica/websocket-contracts';

@Injectable()
export class ArchivistWebSocketClientService implements OnModuleInit, OnModuleDestroy {
  private socket: Socket | null = null;
  private readonly logger = new Logger(ArchivistWebSocketClientService.name);
  private readonly pendingRequests = new Map<string, { resolve: Function; reject: Function }>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Try to connect but don't fail startup if services aren't ready
    this.connect().catch(err => {
      this.logger.warn(`Could not connect to archivist on startup: ${err.message}`);
      this.logger.warn(`Will retry when first request is made`);
    });
  }

  async onModuleDestroy() {
    this.disconnect();
  }

  private async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const host = this.configService.get<string>('ARCHIVIST_HOST', 'localhost');
    const port = this.configService.get<number>('ARCHIVIST_PORT', 3002);
    const url = `ws://${host}:${port}`;

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Failed to connect to archivist service'));
      }, 5000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        this.logger.log(`Connected to archivist service at ${url}`);
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.logger.error('Failed to connect to archivist service:', error);
        reject(error);
      });

      this.socket!.connect();
    });
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.logger.log('Disconnected from archivist service');
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      this.logger.warn('Disconnected from archivist service');
    });

    this.socket.on('reconnect', () => {
      this.logger.log('Reconnected to archivist service');
    });

    this.socket.on('error', (error) => {
      this.logger.error('Archivist service error:', error);
    });
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendMessage(action: string, payload: any): Promise<any> {
    if (!this.socket?.connected) {
      this.logger.log('Not connected to archivist, attempting to connect...');
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to connect to archivist service: ${error.message}`);
      }
    }

    // Create proper request message structure per WebSocket contracts
    const message = {
      id: this.generateMessageId(),
      type: 'request' as const,
      service: 'archivist',
      action,
      payload,
    };

    // Validate message against contract in development mode
    if (process.env.NODE_ENV === 'development') {
      const validation = ContractUtils.dev.validate.request(action, message);
      if (!validation.success) {
        this.logger.warn(`Contract validation failed for action ${action}:`, 'error' in validation ? validation.error : 'Unknown validation error');
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout for archivist service'));
      }, 30000);

      this.socket!.emit(action, message, (response: any) => {
        clearTimeout(timeout);
        
        if (response && response.success === false) {
          reject(new Error(response.error || 'Request failed'));
        } else {
          resolve(response?.data || response);
        }
      });
    });
  }

  // =====================================================
  // FACT OPERATIONS
  // =====================================================

  async getFact(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET, payload);
  }

  async getFacts(factUIDs: number[]): Promise<any> {
    // For multiple facts, we'll need to make multiple calls or use batch operation
    const promises = factUIDs.map(uid => this.getFact(uid));
    return Promise.all(promises);
  }

  async getSpecializationFact(uid: number): Promise<any> {
    // This might need a specific action or can be handled through fact relationships
    return this.getFact(uid);
  }

  async getSubtypes(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_SUBTYPES, payload);
  }

  async getSubtypesCone(uid: number): Promise<any> {
    // This might be a variant of GET_SUBTYPES with recursive flag
    const payload = { uid, includeSubtypes: true };
    return this.sendMessage(FactActions.GET_SUBTYPES, payload);
  }

  async getSpecializationHierarchy(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_SUPERTYPES, payload);
  }

  async retrieveAllFacts(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET, payload);
  }

  async getDefinitiveFacts(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET, payload);
  }

  async getRelatedOnUIDSubtypeCone(lh_object_uid: number, rel_type_uid: number): Promise<any> {
    const payload = { 
      uid: lh_object_uid, 
      includeSubtypes: true,
      maxDepth: 10, // reasonable default for cone searches
    };
    return this.sendMessage(FactActions.GET, payload);
  }

  async getFactsRelatingEntities(uid1: number, uid2: number): Promise<any> {
    const payload = { uid: uid1 }; // Start with one entity, then filter by the other
    return this.sendMessage(FactActions.GET, payload);
  }

  async getClassified(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_CLASSIFIED, payload);
  }

  async getClassificationFact(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_CLASSIFIED, payload);
  }

  async deleteFact(uid: number): Promise<any> {
    const payload = { fact_uid: uid };
    return this.sendMessage(FactActions.DELETE, payload);
  }

  async createKind(parentUID: number, parentName: string, name: string, definition: string): Promise<any> {
    const payload = {
      lh_object_uid: 1, // temporary UID will be assigned by system
      rh_object_uid: parentUID,
      rel_type_uid: 1146, // specialization relationship
      // Additional properties for entity creation
      lh_object_name: name,
      rh_object_name: parentName,
      rel_type_name: 'is a specialization of',
      full_definition: definition,
    };
    return this.sendMessage(FactActions.CREATE, payload);
  }

  async createIndividual(kindUID: number, kindName: string, name: string, definition: string): Promise<any> {
    const payload = {
      lh_object_uid: 1, // temporary UID will be assigned by system
      rh_object_uid: kindUID,
      rel_type_uid: 1225, // classification relationship
      // Additional properties for entity creation
      lh_object_name: name,
      rh_object_name: kindName,
      rel_type_name: 'is classified as a',
      full_definition: definition,
    };
    return this.sendMessage(FactActions.CREATE, payload);
  }

  // =====================================================
  // ENTITY OPERATIONS
  // =====================================================

  async getEntity(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(ConceptActions.GET, payload);
  }

  async getCategory(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(ConceptActions.GET, payload);
  }

  async getEntityType(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(ConceptActions.GET, payload);
  }

  async deleteEntity(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(ConceptActions.DELETE, payload);
  }

  // =====================================================
  // SEARCH OPERATIONS
  // =====================================================

  async textSearchExact(searchTerm: string): Promise<any> {
    const payload = { 
      query: searchTerm,
      filters: { exactMatch: true }
    };
    return this.sendMessage(SearchActions.GENERAL, payload);
  }

  // =====================================================
  // SUBMISSION OPERATIONS
  // =====================================================

  async submitDefinition(fact_uid: number, partial_definition: string, full_definition: string): Promise<any> {
    const payload = {
      uid: fact_uid,
      definition: {
        partial_definition,
        full_definition,
      }
    };
    return this.sendMessage(DefinitionActions.UPDATE, payload);
  }

  async submitCollection(fact_uid: number, collection_uid: number, collection_name: string): Promise<any> {
    // Collection submission as metadata update
    const payload = {
      facts: [{
        lh_object_uid: fact_uid,
        rh_object_uid: collection_uid,
        rel_type_uid: 1, // Placeholder - would need appropriate relation type
        collection_name,
      }],
      metadata: { type: 'collection_update' }
    };
    return this.sendMessage(SubmissionActions.SUBMIT, payload);
  }

  async submitName(fact_uid: number, name: string): Promise<any> {
    // Name submission as metadata update
    const payload = {
      facts: [{
        lh_object_uid: fact_uid,
        rh_object_uid: 1, // Placeholder - entity being named
        rel_type_uid: 1, // Placeholder - would need appropriate relation type
        name,
      }],
      metadata: { type: 'name_update' }
    };
    return this.sendMessage(SubmissionActions.SUBMIT, payload);
  }
}