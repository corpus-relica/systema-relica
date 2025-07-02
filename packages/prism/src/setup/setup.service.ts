import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { createSetupActor, SetupEvent, SetupContext } from './setup.machine';
import { Neo4jService } from '../database/neo4j.service';
import { BatchService } from '../batch/batch.service';
import { CacheService } from '../cache/cache.service';
import { UsersService } from '../database/users/users.service';
import { Actor } from 'xstate';

@Injectable()
export class SetupService implements OnModuleInit {
  private actor: Actor<any>;
  private webSocketGateway: any; // Will be injected via setter to avoid circular dependency

  constructor(
    private neo4jService: Neo4jService,
    @Inject(forwardRef(() => BatchService)) private batchService: BatchService,
    @Inject(forwardRef(() => CacheService)) private cacheService: CacheService,
    private usersService: UsersService,
  ) {}

  onModuleInit() {
    this.actor = createSetupActor();
    
    // Subscribe to state changes and broadcast updates
    this.actor.subscribe((state) => {
      console.log('Setup state changed:', JSON.stringify(state.value), state.context);
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
    let stateId: string;
    let substate: string | null = null;
    
    // Handle different state formats from XState
    if (typeof state === 'string') {
      stateId = state;
    } else if (Array.isArray(state)) {
      stateId = state[0] || 'unknown';
      substate = state[1] || null;
    } else if (typeof state === 'object' && state !== null) {
      // Handle compound state objects like { building_caches: 'building_facts_cache' }
      const keys = Object.keys(state);
      if (keys.length > 0) {
        stateId = keys[0];
        substate = state[keys[0]];
      } else {
        stateId = 'unknown';
      }
    } else {
      stateId = 'unknown';
    }
    
    // Use canonical contract format
    return {
      status: stateId,
      stage: substate,
      message: context.statusMessage || this.getDefaultStatusMessage(stateId, substate),
      progress: this.calculateProgress(state),
      error: context.errorMessage,
      timestamp: new Date().toISOString(),
    };
  }

  private getDefaultStatusMessage(stateId: string, substate?: string | null): string {
    if (substate) {
      switch (substate) {
        case 'building_facts_cache': return 'Building entity facts cache...';
        case 'building_lineage_cache': return 'Building entity lineage cache...';
        case 'building_subtypes_cache': return 'Building entity subtypes cache...';
        case 'building_caches_complete': return 'Cache building complete';
        default: return `Processing ${substate}...`;
      }
    }
    
    switch (stateId) {
      case 'idle': return 'System is ready for setup';
      case 'checking_db': return 'Checking database connection...';
      case 'awaiting_user_credentials': return 'Waiting for admin user credentials';
      case 'creating_admin_user': return 'Creating admin user...';
      case 'seeding_db': return 'Seeding database with initial data...';
      case 'building_caches': return 'Building system caches...';
      case 'setup_complete': return 'Setup completed successfully';
      case 'error': return 'Setup encountered an error';
      default: return 'Unknown status';
    }
  }

  private calculateProgress(state: any): number {
    let stateStr: string;
    let substate: string | null = null;
    
    // Extract state info based on format
    if (typeof state === 'string') {
      stateStr = state;
    } else if (Array.isArray(state)) {
      stateStr = state[0];
      substate = state[1] || null;
    } else if (typeof state === 'object' && state !== null) {
      const keys = Object.keys(state);
      if (keys.length > 0) {
        stateStr = keys[0];
        substate = state[keys[0]];
      } else {
        stateStr = 'unknown';
      }
    } else {
      stateStr = 'unknown';
    }
    
    switch (stateStr) {
      case 'idle': return 0;
      case 'checking_db': return 5;
      case 'awaiting_user_credentials': return 10;
      case 'creating_admin_user': return 20;
      case 'seeding_db': return 30;
      case 'building_caches': {
        if (substate) {
          switch (substate) {
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
    let stateStr: string;
    let substate: string | null = null;
    
    // Extract state info based on format
    if (typeof state === 'string') {
      stateStr = state;
    } else if (Array.isArray(state)) {
      stateStr = state[0];
      substate = state[1] || null;
    } else if (typeof state === 'object' && state !== null) {
      const keys = Object.keys(state);
      if (keys.length > 0) {
        stateStr = keys[0];
        substate = state[keys[0]];
      } else {
        stateStr = 'unknown';
      }
    } else {
      stateStr = 'unknown';
    }
    
    console.log(`Processing state: ${stateStr}, substate: ${substate}`);
    
    try {
      switch (stateStr) {
        case 'checking_db':
          await this.checkDatabaseActivity();
          break;
        case 'seeding_db':
          await this.seedDatabaseActivity();
          break;
        case 'building_caches':
          if (substate) {
            await this.handleCacheBuildingActivity(substate);
          }
          break;
        case 'awaiting_user_credentials':
          // This state is handled by the client submitting credentials
          break;
        case 'creating_admin_user':
          // This state is handled by the client submitting user creation data
          console.log('Awaiting user credentials submission...');
          console.log(context)
          console.log('_________________________________________________________');
          
          // Create admin user if credentials are available
          if (context.userCredentials) {
            this.createAdminUserActivity(context.userCredentials);
          }
          break;

        default:
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

  private async createAdminUserActivity(userCredentials: { username: string; email: string; password: string }) {
    console.log('[Activity] Creating admin user:', userCredentials.username);
    try {
      // Validate credentials
      const validation = this.validateCredentials(userCredentials);
      if (!validation.valid) {
        this.sendEvent({ type: 'USER_CREATION_ERROR', errorMessage: validation.message });
        return;
      }

      // Check for existing users
      const existingUserByEmail = await this.usersService.findByEmail(userCredentials.email);
      if (existingUserByEmail) {
        this.sendEvent({ 
          type: 'USER_CREATION_ERROR', 
          errorMessage: 'A user with this email address already exists. Please use a different email.' 
        });
        return;
      }

      const existingUserByUsername = await this.usersService.findOne(userCredentials.username);
      if (existingUserByUsername) {
        this.sendEvent({ 
          type: 'USER_CREATION_ERROR', 
          errorMessage: 'This username is already taken. Please choose a different username.' 
        });
        return;
      }

      // Create the admin user
      const user = await this.usersService.create({
        email: userCredentials.email,
        username: userCredentials.username,
        password: userCredentials.password,
        first_name: 'Admin',
        last_name: 'User',
      });

      console.log('Created admin user in PostgreSQL:', { id: user.id, username: user.username, email: user.email });
      this.sendEvent({ type: 'USER_CREATION_SUCCESS' });
    } catch (error) {
      console.error('Error creating admin user:', error);
      
      // Handle database constraint errors
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        let errorMessage = 'User creation failed due to duplicate information.';
        if (error.message.includes('email')) {
          errorMessage = 'A user with this email address already exists.';
        } else if (error.message.includes('username')) {
          errorMessage = 'This username is already taken.';
        }
        this.sendEvent({ type: 'USER_CREATION_ERROR', errorMessage });
      } else {
        // For other errors, use the generic ERROR event that goes to error state
        this.sendEvent({ type: 'ERROR', errorMessage: `Failed to create admin user: ${error.message}` });
      }
    }
  }

  private validateCredentials(credentials: { username: string; email: string; password: string }) {
    const { username, password, email } = credentials;
    
    if (!username || username.trim().length === 0) {
      return { valid: false, message: 'Username cannot be blank' };
    }

    if (username.length < 4) {
      return { valid: false, message: 'Username must be at least 4 characters' };
    }

    if (!email || email.trim().length === 0) {
      return { valid: false, message: 'Email cannot be blank' };
    }

    if (!password || password.trim().length === 0) {
      return { valid: false, message: 'Password cannot be blank' };
    }

    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }

    return { valid: true };
  }

  private async seedDatabaseActivity() {
    console.log('[Activity] Starting DB seed...');
    try {
      const result = await this.batchService.seedDatabase();
      
      if (result.success) {
        // Log seeding statistics if available
        if (result.statistics) {
          const stats = result.statistics;
          console.log('[Setup] Database seeding statistics:');
          console.log(`  Files processed: ${stats.processedFiles}/${stats.totalFiles}`);
          console.log(`  Nodes: ${stats.nodes.loaded} loaded, ${stats.nodes.skipped} skipped`);
          console.log(`  Relationships: ${stats.relationships.loaded} loaded, ${stats.relationships.skipped} skipped`);
          
          // Check if we had significant data skipping
          const totalSkipped = stats.nodes.skipped + stats.relationships.skipped;
          const totalLoaded = stats.nodes.loaded + stats.relationships.loaded;
          
          if (totalSkipped > 0 && totalLoaded > 0) {
            console.log(`[Setup] ⚠️  Warning: Database seeding completed with ${totalSkipped} items skipped due to data quality issues`);
          }
        }
        
        this.sendEvent({ type: 'SEEDING_COMPLETE' });
      } else {
        console.error('[Setup] Database seeding failed:', result.error);
        
        // Check if this was a partial failure (some data loaded)
        if (result.statistics?.nodes?.loaded > 0 || result.statistics?.relationships?.loaded > 0) {
          console.log('[Setup] Some data was loaded despite errors. Continuing setup process...');
          this.sendEvent({ type: 'SEEDING_COMPLETE' });
        } else {
          // Complete failure - skip seeding stage
          console.log('[Setup] No data was loaded. Skipping database seeding...');
          this.sendEvent({ type: 'SEEDING_SKIPPED' });
        }
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

  public submitCredentials(username: string, email:string, password: string) {
    this.sendEvent({ type: 'SUBMIT_CREDENTIALS', data: { username, email, password } });
  }

  public async resetSystem(): Promise<{ success: boolean; message?: string; errors?: string[] }> {
    console.log('🚨 Starting system reset...');
    const errors: string[] = [];
    
    try {
      // Step 1: Reset the state machine to idle
      console.log('Resetting setup state machine...');
      if (this.actor) {
        this.actor.stop();
        this.actor = createSetupActor();
        this.actor.subscribe((state) => {
          console.log('Setup state changed:', state.value, state.context);
          this.broadcastStateUpdate(state.context, state.value);
          this.processState(state.value, state.context);
        });
        this.actor.start();
      }

      // Step 2: Clear Neo4j database
      console.log('Clearing Neo4j database...');
      const neo4jResult = await this.neo4jService.clearDatabase();
      if (!neo4jResult.success) {
        errors.push(`Neo4j: ${neo4jResult.error}`);
      }

      // Step 3: Clear Redis cache
      console.log('Clearing Redis cache...');
      const redisResult = await this.cacheService.clearCache();
      if (!redisResult.success) {
        errors.push(`Redis: ${redisResult.error}`);
      }

      // Step 4: Clear PostgreSQL users managed by Prism
      console.log('Clearing PostgreSQL users...');
      try {
        await this.usersService.clearAllUsers();
        console.log('✅ PostgreSQL users cleared successfully');
      } catch (pgError) {
        errors.push(`PostgreSQL users: ${pgError.message}`);
      }

      // Note: Other PostgreSQL databases (Clarity/Aperture) would need separate service calls

      const success = errors.length === 0;
      const message = success 
        ? '✅ System reset completed successfully'
        : `⚠️ System reset completed with ${errors.length} error(s)`;

      console.log(message);
      if (errors.length > 0) {
        console.error('Reset errors:', errors);
      }

      return {
        success,
        message,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ System reset failed:', error);
      return {
        success: false,
        message: `System reset failed: ${error.message}`,
        errors: [error.message]
      };
    }
  }
}
