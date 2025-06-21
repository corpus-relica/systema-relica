import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import customParser from 'socket.io-msgpack-parser';
import {
  FactActions,
  SearchActions,
  ConceptActions,
  SubmissionActions,
  DefinitionActions,
  KindActions,
  EntityActions,
  QueryActions,
  UIDActions,
  CompletionActions,
  TransactionActions,
  ValidationActions,
  SpecializationActions,
  LineageActions,
} from '@relica/websocket-contracts';

@Injectable()
export class ArchivistSocketClient implements OnModuleInit, OnModuleDestroy {
  private socket: Socket | null = null;
  private readonly logger = new Logger(ArchivistSocketClient.name);
  private readonly pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
  private messageCounter = 0;

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
      // parser: customParser, // Use msgpack parser for better performance
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
    // return `archivist-${Date.now()}-${++this.messageCounter}`;
    // generate valid uuid
    return crypto.randomUUID();
  }

  private async sendMessage(action: string, payload: any): Promise<any> {
    if (!this.socket?.connected) {
      this.logger.log('Not connected to archivist, attempting to connect...');
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to connect to archivist service: ${error instanceof Error ? error.message : String(error)}`);
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
    // For multiple facts, make multiple calls or use batch operation
    const promises = factUIDs.map(uid => this.getFact(uid));
    return Promise.all(promises);
  }

  async createFact(fact: any): Promise<any> {
    return this.sendMessage(FactActions.CREATE, fact);
  }

  async deleteFact(factUid: number): Promise<any> {
    const payload = { fact_uid: factUid };
    return this.sendMessage(FactActions.DELETE, payload);
  }

  async getSubtypes(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_SUBTYPES, payload);
  }

  async getSubtypesCone(uid: number): Promise<any> {
    const payload = { uid, includeSubtypes: true };
    return this.sendMessage(FactActions.GET_SUBTYPES, payload);
  }

  async getSupertypes(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_SUPERTYPES, payload);
  }

  async getSpecializationHierarchy(uidOrUserId: number, uid?: number): Promise<any> {
    // Support both signatures:
    // getSpecializationHierarchy(uid: number) - original
    // getSpecializationHierarchy(userId: number, uid: number) - Aperture style
    if (uid !== undefined) {
      // Aperture-style call with userId
      const payload = { uid, 'user-id': uidOrUserId };
      return this.sendMessage(SpecializationActions.SPECIALIZATION_HIERARCHY_GET, payload);
    } else {
      // Original style call with just uid
      const payload = { uid: uidOrUserId };
      return this.sendMessage(FactActions.GET_SUPERTYPES, payload);
    }
  }

  async getSpecializationFact(userId: number, uid: number): Promise<any> {
    const payload = { uid, 'user-id': userId };
    return this.sendMessage(SpecializationActions.SPECIALIZATION_FACT_GET, payload);
  }

  async getClassified(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_CLASSIFIED, payload);
  }

  async getClassificationFact(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_CLASSIFIED, payload);
  }

  async retrieveAllFacts(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET, payload);
  }

  async getDefinitiveFacts(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(FactActions.GET_DEFINITIVE, payload);
  }

  async getFactsRelatingEntities(uid1: number, uid2: number): Promise<any> {
    const payload = { query: `relating:${uid1}:${uid2}` };
    return this.sendMessage(QueryActions.EXECUTE, payload);
  }

  async createKind(parentUID: number, parentName: string, name: string, definition: string): Promise<any> {
    const payload = {
      lh_object_uid: 1, // temporary UID will be assigned by system
      rh_object_uid: parentUID,
      rel_type_uid: 1146, // specialization relationship
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
    console.log('Fetching category for entity UID:', EntityActions.CATEGORY_GET, uid);
    return this.sendMessage(EntityActions.CATEGORY_GET, payload);
  }

  async getEntityType(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(EntityActions.TYPE_GET, payload);
  }

  async getEntityCategory(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(EntityActions.CATEGORY_GET, payload);
  }

  async deleteEntity(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendMessage(ConceptActions.DELETE, payload);
  }

  async resolveUIDs(uids: number[]): Promise<any> {
    const payload = { uids };
    return this.sendMessage(EntityActions.BATCH_RESOLVE, payload);
  }

  async getEntityCollections(): Promise<any> {
    const payload = {};
    return this.sendMessage(EntityActions.COLLECTIONS_GET, payload);
  }

  // =====================================================
  // KIND OPERATIONS
  // =====================================================

  async getKinds(): Promise<any> {
    const payload = {};
    return this.sendMessage(KindActions.LIST, payload);
  }

  async getKindsList(sortField: string = 'lh_object_name', sortOrder: string = 'ASC', skip: number = 0, pageSize: number = 10, filters: any = {}): Promise<any> {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Fetching kinds with filters:', { sortField, sortOrder, skip, pageSize, filters });
    const payload = {
      filters: {
        sort: [sortField, sortOrder],
        range: [skip, pageSize],
        filter: filters
      }
    };
    console.log('#####', payload)
    return this.sendMessage(KindActions.LIST, payload);
  }

  // =====================================================
  // SEARCH OPERATIONS
  // =====================================================

  async searchText(query: string, collectionUID?: number, limit?: number, offset?: number, searchFilter?: string): Promise<any> {
    // Convert offset to page number (1-based)
    const page = offset ? Math.floor(offset / (limit || 20)) + 1 : 1;
    
    const payload = { 
      searchTerm: query, 
      collectionUID, 
      page, 
      pageSize: limit || 20, 
      filter: searchFilter 
    };
    return this.sendMessage(SearchActions.GENERAL, payload);
  }

  async textSearch(params: { searchTerm: string; exactMatch?: boolean }): Promise<any> {
    const payload = { 
      query: params.searchTerm,
      filters: { exactMatch: params.exactMatch }
    };
    return this.sendMessage(SearchActions.GENERAL, payload);
  }

  async textSearchExact(searchTerm: string): Promise<any> {
    const payload = { 
      query: searchTerm,
      filters: { exactMatch: true }
    };
    return this.sendMessage(SearchActions.GENERAL, payload);
  }

  async searchUid(uid: string): Promise<any> {
    const payload = { uid };
    return this.sendMessage(SearchActions.UID, payload);
  }

  async uidSearch(params: { searchUID: number }): Promise<any> {
    return this.sendMessage(SearchActions.UID, params);
  }

  // =====================================================
  // SUBMISSION OPERATIONS
  // =====================================================

  async submitFact(factData: any): Promise<any> {
    return this.sendMessage(SubmissionActions.SUBMIT, { facts: [factData] });
  }

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

  // =====================================================
  // SPECIALIZED OPERATIONS (from Aperture implementation)
  // =====================================================

  async getAllRelated(entityUid: number): Promise<any> {
    const payload = { query: `related:${entityUid}` };
    return this.sendMessage(QueryActions.EXECUTE, payload);
  }

  async getRecursiveRelations(entityUid: number, relTypeUid: number): Promise<any> {
    const payload = { query: `recursive:${entityUid}:${relTypeUid}` };
    return this.sendMessage(QueryActions.EXECUTE, payload);
  }

  async getRecursiveRelationsTo(entityUid: number, relTypeUid: number): Promise<any> {
    const payload = { query: `recursiveTo:${entityUid}:${relTypeUid}` };
    return this.sendMessage(QueryActions.EXECUTE, payload);
  }

  async getRequiredRoles(relTypeUid: number): Promise<any> {
    const payload = { query: `requiredRoles:${relTypeUid}` };
    return this.sendMessage(QueryActions.EXECUTE, payload);
  }

  async getRolePlayers(relTypeUid: number): Promise<any> {
    const payload = { query: `rolePlayers:${relTypeUid}` };
    return this.sendMessage(QueryActions.EXECUTE, payload);
  }

  async getRelatedOnUIDSubtypeCone(lh_object_uid: number, rel_type_uid: number): Promise<any> {
    const payload = { 
      uid: lh_object_uid, 
      includeSubtypes: true,
      maxDepth: 10, // reasonable default for cone searches
    };
    return this.sendMessage(FactActions.GET, payload);
  }

  // =====================================================
  // CONNECTION UTILITIES
  // =====================================================

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }

  async getFactsBatch(config: { skip: number; range: number; relTypeUids?: number[] }): Promise<any> {
    return this.sendMessage(FactActions.BATCH_GET, config);
  }

  async getEntityLineageViaEndpoint(entityUid: number): Promise<any> {
    return this.sendMessage(LineageActions.GET, { uid: entityUid });
  }
}
