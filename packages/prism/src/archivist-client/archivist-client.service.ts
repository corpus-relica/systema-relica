import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import { 
  FactActions, 
  SearchActions, 
  QueryActions,
  LineageActions,
  ContractUtils
} from '@relica/websocket-contracts';
import { Fact } from '@relica/types';

@Injectable()
export class ArchivistClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ArchivistClientService.name);
  private socket: Socket;
  private messageCounter = 0;
  private isConnected = false;

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
    const archivistUrl = this.configService.get<string>('ARCHIVIST_URL', 'http://localhost:3000');
    
    this.socket = io(archivistUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.logger.log(`Connected to Archivist at ${archivistUrl}`);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      this.logger.warn('Disconnected from Archivist');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error('Failed to connect to Archivist:', error);
    });

    return new Promise((resolve) => {
      this.socket.on('connect', () => resolve());
      // Add timeout to prevent hanging if Archivist is not available
      setTimeout(() => {
        if (!this.isConnected) {
          this.logger.warn('Connection to Archivist timed out, continuing without connection');
          resolve();
        }
      }, 5000);
    });
  }

  private generateMessageId(): string {
    return `prism-${Date.now()}-${++this.messageCounter}`;
  }

  private async sendMessage(action: string, payload: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Archivist service');
    }

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

  /**
   * Get all facts in batches for cache building
   * This uses pagination to avoid overwhelming memory
   */
  async getAllFactsInBatches(batchSize: number = 1000, onBatch?: (facts: Fact[], batchNumber: number) => void): Promise<Fact[]> {
    const allFacts: Fact[] = [];
    let pageNumber = 0;
    let batchNumber = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        // Use the search endpoint with pagination
        const response = await this.sendMessage(SearchActions.GENERAL, {
          query: '*', // Get all facts
          pageSize: batchSize,
          pageNumber: pageNumber,
          includeFactDetails: true
        });

        const facts = response?.data?.results || [];
        
        if (facts.length === 0) {
          hasMore = false;
        } else {
          allFacts.push(...facts);
          batchNumber++;
          
          if (onBatch) {
            await onBatch(facts, batchNumber);
          }
          
          pageNumber++;
          
          // If we got less than batchSize, we've reached the end
          if (facts.length < batchSize) {
            hasMore = false;
          }
        }
      } catch (error) {
        this.logger.error(`Error fetching facts batch at page ${pageNumber}:`, error);
        hasMore = false; // Stop on error to prevent infinite loop
      }
    }

    return allFacts;
  }

  /**
   * Get facts for entities with specific relation type UIDs (for lineage cache)
   */
  async getFactsByRelationType(relTypeUids: number[]): Promise<Fact[]> {
    try {
      const response = await this.sendMessage(QueryActions.EXECUTE, {
        query: `relationType:${relTypeUids.join(',')}`,
        parameters: { relTypeUids }
      });

      return response?.data || [];
    } catch (error) {
      this.logger.error('Error fetching facts by relation type:', error);
      return [];
    }
  }

  /**
   * Get lineage for a specific entity
   */
  async getEntityLineage(entityUid: number): Promise<number[]> {
    try {
      const response = await this.sendMessage(FactActions.GET_SUPERTYPES, {
        uid: entityUid,
        includeSubtypes: false
      });

      // Extract UIDs from the response
      const supertypes = response?.data || [];
      return supertypes.map((item: any) => 
        typeof item === 'object' ? item.lh_object_uid || item.uid : item
      );
    } catch (error) {
      this.logger.error(`Error fetching lineage for entity ${entityUid}:`, error);
      return [];
    }
  }

  /**
   * Get all subtypes (descendants) of an entity
   */
  async getEntitySubtypes(entityUid: number): Promise<number[]> {
    try {
      const response = await this.sendMessage(FactActions.GET_SUBTYPES, {
        uid: entityUid,
        includeSubtypes: true,
        recursive: true
      });

      // Extract UIDs from the response
      const subtypes = response?.data || [];
      return subtypes.map((item: any) => 
        typeof item === 'object' ? item.lh_object_uid || item.uid : item
      );
    } catch (error) {
      this.logger.error(`Error fetching subtypes for entity ${entityUid}:`, error);
      return [];
    }
  }

  /**
   * Get facts in batches for cache building
   * Matches the Clojure implementation's get-batch function
   */
  async getFactsBatch(config: { skip: number; range: number; relTypeUids?: number[] }): Promise<{ facts: any[] }> {
    try {
      const response = await this.sendMessage(FactActions.BATCH_GET, config);
      return response || { facts: [] };
    } catch (error) {
      this.logger.error('Error fetching facts batch:', error);
      return { facts: [] };
    }
  }

  /**
   * Get total count of facts in the database
   */
  async getFactsCount(): Promise<number> {
    try {
      const response = await this.sendMessage(FactActions.COUNT, {});
      return response?.count || 0;
    } catch (error) {
      this.logger.error('Error fetching facts count:', error);
      return 0;
    }
  }

  /**
   * Get lineage (ancestors) for a specific entity using the lineage endpoint
   */
  async getEntityLineageViaEndpoint(entityUid: number): Promise<number[]> {
    try {
      const response = await this.sendMessage(LineageActions.GET, {
        uid: entityUid
      });

      // Extract UIDs from the lineage response
      const lineage = response?.data || response || [];
      if (Array.isArray(lineage)) {
        return lineage.map((item: any) => 
          typeof item === 'object' ? item.uid || item.lh_object_uid : item
        ).filter(uid => typeof uid === 'number');
      }
      return [];
    } catch (error) {
      this.logger.error(`Error fetching lineage for entity ${entityUid}:`, error);
      return [];
    }
  }

  /**
   * Check if the service is connected
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }
}
