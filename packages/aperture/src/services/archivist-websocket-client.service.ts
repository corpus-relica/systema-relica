import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import { 
  FactActions, 
  SearchActions, 
  ConceptActions, 
  QueryActions, 
  KindActions, 
  UIDActions,
  CompletionActions,
  DefinitionActions,
  SubmissionActions,
  TransactionActions,
  ValidationActions,
  SpecializationActions,
  ContractUtils
} from '@relica/websocket-contracts';

@Injectable()
export class ArchivistWebSocketClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ArchivistWebSocketClientService.name);
  private socket: Socket;
  private messageCounter = 0;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private async connect(): Promise<void> {
    const archivistUrl = this.configService.get<string>('ARCHIVIST_URL', 'http://localhost:3002');
    
    this.socket = io(archivistUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.logger.log(`Connected to Archivist at ${archivistUrl}`);
    });

    this.socket.on('disconnect', () => {
      this.logger.warn('Disconnected from Archivist');
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error('Failed to connect to Archivist:', error);
    });

    return new Promise((resolve) => {
      this.socket.on('connect', () => resolve());
    });
  }

  private generateMessageId(): string {
    return `aperture-${Date.now()}-${++this.messageCounter}`;
  }

  private async sendMessage(action: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const message = {
        id: this.generateMessageId(),
        type: 'request' as const,
        service: 'archivist',
        action,
        payload,
      };

      // Validate contract in development mode
      if (process.env.NODE_ENV === 'development') {
        const validation = ContractUtils.dev.validate.request(action, message);
        if (!validation.success) {
          this.logger.warn(`Contract validation failed for action ${action}:`, 'error' in validation ? validation.error : 'Unknown validation error');
        }
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${action}`));
      }, 30000);

      this.socket.emit(action, message, (response: any) => {
        clearTimeout(timeout);
        
        if (response?.success === false) {
          reject(new Error(response?.error?.message || `Request failed for ${action}`));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Text Search
  async textSearch(params: { searchTerm: string; exactMatch?: boolean }): Promise<any> {
    this.logger.log(`Text search for: ${params.searchTerm}`);
    return this.sendMessage(SearchActions.GENERAL, { query: params.searchTerm });
  }

  // UID Search
  async uidSearch(params: { searchUID: number }): Promise<any> {
    this.logger.log(`UID search for: ${params.searchUID}`);
    return this.sendMessage(SearchActions.UID, params);
  }

  // Fact Operations
  async createFact(fact: any): Promise<any> {
    this.logger.log('Creating fact');
    return this.sendMessage(FactActions.CREATE, fact);
  }

  async getFact(uid: number): Promise<any> {
    this.logger.log(`Getting fact for uid: ${uid}`);
    return this.sendMessage(FactActions.GET, { uid });
  }

  async getSubtypes(uid: number): Promise<any> {
    this.logger.log(`Getting subtypes for uid: ${uid}`);
    return this.sendMessage(FactActions.GET_SUBTYPES, { uid });
  }

  async getSupertypes(uid: number): Promise<any> {
    this.logger.log(`Getting supertypes for uid: ${uid}`);
    return this.sendMessage(FactActions.GET_SUPERTYPES, { uid });
  }

  async getClassified(uid: number): Promise<any> {
    this.logger.log(`Getting classified entities for uid: ${uid}`);
    return this.sendMessage(FactActions.GET_CLASSIFIED, { uid });
  }

  // Entity Operations
  async getEntity(uid: number): Promise<any> {
    this.logger.log(`Getting entity for uid: ${uid}`);
    return this.sendMessage(FactActions.GET, { uid });
  }

  // Specialized Operations (based on Clojure implementation)
  async getSpecializationFact(userId: number, uid: number): Promise<any> {
    this.logger.log(`Getting specialization fact for uid: ${uid}`);
    return this.sendMessage(SpecializationActions.SPECIALIZATION_FACT_GET, { uid, 'user-id': userId });
  }

  async getSpecializationHierarchy(userId: number, uid: number): Promise<any> {
    this.logger.log(`Getting specialization hierarchy for uid: ${uid}`);
    return this.sendMessage(SpecializationActions.SPECIALIZATION_HIERARCHY_GET, { uid, 'user-id': userId });
  }

  async getAllRelated(entityUid: number): Promise<any> {
    this.logger.log(`Getting all related facts for entity: ${entityUid}`);
    return this.sendMessage(QueryActions.EXECUTE, { query: `related:${entityUid}` });
  }

  async getDefinitiveFacts(entityUid: number): Promise<any> {
    this.logger.log(`Getting definitive facts for entity: ${entityUid}`);
    return this.sendMessage(FactActions.GET, { uid: entityUid });
  }

  async getFactsRelatingEntities(entityUid1: number, entityUid2: number): Promise<any> {
    this.logger.log(`Getting facts relating entities ${entityUid1} and ${entityUid2}`);
    return this.sendMessage(QueryActions.EXECUTE, { query: `relating:${entityUid1}:${entityUid2}` });
  }

  async getSubtypesCone(uid: number): Promise<any> {
    this.logger.log(`Getting subtypes cone for uid: ${uid}`);
    return this.sendMessage(FactActions.GET_SUBTYPES, { uid, recursive: true });
  }

  async getClassificationFact(entityUid: number): Promise<any> {
    this.logger.log(`Getting classification fact for entity: ${entityUid}`);
    return this.sendMessage(FactActions.GET_CLASSIFIED, { uid: entityUid });
  }

  async getRecursiveRelations(entityUid: number, relTypeUid: number): Promise<any> {
    this.logger.log(`Getting recursive relations for entity ${entityUid}, rel type ${relTypeUid}`);
    return this.sendMessage(QueryActions.EXECUTE, { query: `recursive:${entityUid}:${relTypeUid}` });
  }

  async getRecursiveRelationsTo(entityUid: number, relTypeUid: number): Promise<any> {
    this.logger.log(`Getting recursive relations to entity ${entityUid}, rel type ${relTypeUid}`);
    return this.sendMessage(QueryActions.EXECUTE, { query: `recursiveTo:${entityUid}:${relTypeUid}` });
  }

  async getRequiredRoles(relTypeUid: number): Promise<any> {
    this.logger.log(`Getting required roles for relation type: ${relTypeUid}`);
    return this.sendMessage(QueryActions.EXECUTE, { query: `requiredRoles:${relTypeUid}` });
  }

  async getRolePlayers(relTypeUid: number): Promise<any> {
    this.logger.log(`Getting role players for relation type: ${relTypeUid}`);
    return this.sendMessage(QueryActions.EXECUTE, { query: `rolePlayers:${relTypeUid}` });
  }
}
