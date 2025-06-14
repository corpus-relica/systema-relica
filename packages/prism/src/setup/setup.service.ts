import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { createSetupActor, SetupEvent, SetupContext } from './setup.machine';
import { Neo4jService } from '../database/neo4j.service';
import { BatchService } from '../batch/batch.service';
import { CacheService } from '../cache/cache.service';
import { Actor } from 'xstate';

@Injectable()
export class SetupService implements OnModuleInit {
  private actor: Actor<any>;
  private webSocketGateway: any; // Will be injected via setter to avoid circular dependency

  constructor(
    private neo4jService: Neo4jService,
    @Inject(forwardRef(() => BatchService)) private batchService: BatchService,
    @Inject(forwardRef(() => CacheService)) private cacheService: CacheService,
  ) {}

  onModuleInit() {
    this.actor = createSetupActor();
    
    // Subscribe to state changes and broadcast updates
    this.actor.subscribe((state) => {
      console.log('Setup state changed:', state.value, state.context);
      this.broadcastStateUpdate(state.context, state.value);
      
      // Handle activities based on current state
      this.processState(state.value, state.context);
    });

    this.actor.start();
  }

  private broadcastStateUpdate(context: SetupContext, state: any) {
    const formattedState = this.formatStateForClient(context, state);
    console.log('Broadcasting setup update:', formattedState);
    if (this.webSocketGateway) {
      this.webSocketGateway.broadcastSetupUpdate(formattedState);
    }
  }

  public setWebSocketGateway(gateway: any) {
    this.webSocketGateway = gateway;
  }

  private formatStateForClient(context: SetupContext, state: any) {
    return {
      status: typeof state === 'string' ? state : state[0] || 'unknown',
      stage: Array.isArray(state) ? state[1] : null,
      message: context.statusMessage,
      progress: this.calculateProgress(state),
      error: context.errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateProgress(state: any): number {
    const stateStr = typeof state === 'string' ? state : state[0];
    
    switch (stateStr) {
      case 'idle': return 0;
      case 'checking_db': return 5;
      case 'awaiting_user_credentials': return 10;
      case 'creating_admin_user': return 20;
      case 'seeding_db': return 30;
      case 'building_caches': {
        if (Array.isArray(state) && state[1]) {
          switch (state[1]) {
            case 'building_facts_cache': return 40;
            case 'building_lineage_cache': return 60;
            case 'building_subtypes_cache': return 80;
            case 'building_caches_complete': return 90;
          }
        }
        return 40;
      }
      case 'setup_complete': return 100;
      case 'error': return -1;
      default: return 0;
    }
  }

  private async processState(state: any, context: SetupContext) {
    const stateStr = typeof state === 'string' ? state : state[0];
    
    try {
      switch (stateStr) {
        case 'checking_db':
          await this.checkDatabaseActivity();
          break;
        case 'seeding_db':
          await this.seedDatabaseActivity();
          break;
        case 'building_caches':
          if (Array.isArray(state) && state[1]) {
            await this.handleCacheBuildingActivity(state[1]);
          }
          break;
      }
    } catch (error) {
      console.error('Error in setup activity:', error);
      this.sendEvent({ type: 'ERROR', errorMessage: error.message });
    }
  }

  private async checkDatabaseActivity() {
    console.log('[Activity] Checking database...');
    try {
      const isEmpty = await this.neo4jService.isDatabaseEmpty();
      if (isEmpty) {
        this.sendEvent({ type: 'DB_CHECK_COMPLETE_EMPTY' });
      } else {
        this.sendEvent({ type: 'DB_CHECK_COMPLETE_NOT_EMPTY' });
      }
    } catch (error) {
      console.error('Error checking database state:', error);
      this.sendEvent({ type: 'ERROR', errorMessage: `Database check failed: ${error.message}` });
    }
  }

  private async seedDatabaseActivity() {
    console.log('[Activity] Starting DB seed...');
    try {
      const result = await this.batchService.seedDatabase();
      if (result.success) {
        this.sendEvent({ type: 'SEEDING_COMPLETE' });
      } else {
        this.sendEvent({ type: 'SEEDING_SKIPPED' });
      }
    } catch (error) {
      console.error('Error during database seeding:', error);
      this.sendEvent({ type: 'ERROR', errorMessage: `Database seeding failed: ${error.message}` });
    }
  }

  private async handleCacheBuildingActivity(cacheState: string) {
    switch (cacheState) {
      case 'building_facts_cache':
        await this.buildFactsCacheActivity();
        break;
      case 'building_lineage_cache':
        await this.buildLineageCacheActivity();
        break;
      case 'building_subtypes_cache':
        await this.buildSubtypesCacheActivity();
        break;
      case 'building_caches_complete':
        this.sendEvent({ type: 'CACHE_BUILD_COMPLETE' });
        break;
    }
  }

  private async buildFactsCacheActivity() {
    console.log('[Activity] Building entity facts cache...');
    try {
      const success = await this.cacheService.buildEntityFactsCache();
      if (success) {
        this.sendEvent({ type: 'FACTS_CACHE_COMPLETE' });
      } else {
        this.sendEvent({ type: 'ERROR', errorMessage: 'Facts cache build failed' });
      }
    } catch (error) {
      console.error('Error building facts cache:', error);
      this.sendEvent({ type: 'ERROR', errorMessage: `Facts cache build failed: ${error.message}` });
    }
  }

  private async buildLineageCacheActivity() {
    console.log('[Activity] Building entity lineage cache...');
    try {
      const success = await this.cacheService.buildEntityLineageCache();
      if (success) {
        this.sendEvent({ type: 'LINEAGE_CACHE_COMPLETE' });
      } else {
        this.sendEvent({ type: 'ERROR', errorMessage: 'Lineage cache build failed' });
      }
    } catch (error) {
      console.error('Error building lineage cache:', error);
      this.sendEvent({ type: 'ERROR', errorMessage: `Lineage cache build failed: ${error.message}` });
    }
  }

  private async buildSubtypesCacheActivity() {
    console.log('[Activity] Building entity subtypes cache...');
    try {
      const success = await this.cacheService.buildSubtypesCache();
      if (success) {
        this.sendEvent({ type: 'SUBTYPES_CACHE_COMPLETE' });
      } else {
        this.sendEvent({ type: 'ERROR', errorMessage: 'Subtypes cache build failed' });
      }
    } catch (error) {
      console.error('Error building subtypes cache:', error);
      this.sendEvent({ type: 'ERROR', errorMessage: `Subtypes cache build failed: ${error.message}` });
    }
  }

  public sendEvent(event: SetupEvent) {
    console.log('Sending event to state machine:', event);
    this.actor.send(event);
  }

  public getSetupState() {
    const snapshot = this.actor.getSnapshot();
    return this.formatStateForClient(snapshot.context, snapshot.value);
  }

  public startSetup() {
    this.sendEvent({ type: 'START_SETUP' });
  }

  public submitCredentials(username: string, password: string) {
    this.sendEvent({ type: 'SUBMIT_CREDENTIALS', data: { username, password } });
    
    // Simulate user creation for now - this should integrate with Shutter service
    setTimeout(() => {
      this.sendEvent({ type: 'USER_CREATION_SUCCESS' });
    }, 1000);
  }
}