import { createActor, interpret, InterpreterFrom } from 'xstate';
import { setupMachine, SetupContext, SetupEvent } from '../setup.machine';

describe('Setup State Machine', () => {
  let service: InterpreterFrom<typeof setupMachine>;

  beforeEach(() => {
    service = createActor(setupMachine);
    service.start();
  });

  afterEach(() => {
    service?.stop();
  });

  describe('Initial State', () => {
    it('should start in idle state', () => {
      expect(service.getSnapshot().value).toBe('idle');
      expect(service.getSnapshot().context.statusMessage).toBe('Idle');
    });

    it('should have initial context values', () => {
      const context = service.getSnapshot().context;
      expect(context.masterUser).toBeUndefined();
      expect(context.errorMessage).toBeUndefined();
      expect(context.dbCheckResult).toBeUndefined();
      expect(context.userCredentials).toBeUndefined();
      expect(context.seedFiles).toEqual([]);
      expect(context.processedCsvFiles).toEqual([]);
      expect(context.cacheResults).toEqual({});
    });
  });

  describe('Database Check Flow', () => {
    it('should transition from idle to checking_db on START_SETUP', () => {
      service.send({ type: 'START_SETUP' });
      
      expect(service.getSnapshot().value).toBe('checking_db');
      expect(service.getSnapshot().context.statusMessage).toBe('Checking database state...');
    });

    it('should transition to awaiting_user_credentials when database is empty', () => {
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_EMPTY' });
      
      expect(service.getSnapshot().value).toBe('awaiting_user_credentials');
      expect(service.getSnapshot().context.dbCheckResult).toBe('empty');
      expect(service.getSnapshot().context.statusMessage).toBe('Awaiting admin user credentials...');
    });

    it('should transition directly to setup_complete when database is not empty', () => {
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_NOT_EMPTY' });
      
      expect(service.getSnapshot().value).toBe('setup_complete');
      expect(service.getSnapshot().context.dbCheckResult).toBe('not-empty');
      expect(service.getSnapshot().context.statusMessage).toBe('Setup complete.');
    });

    it('should handle database check errors', () => {
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'ERROR', errorMessage: 'Database connection failed' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.dbCheckResult).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Database connection failed');
      expect(service.getSnapshot().context.statusMessage).toBe('Error: Database connection failed');
    });

    it('should handle database check errors with default message', () => {
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'ERROR' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Database check failed');
    });
  });

  describe('User Credentials Flow', () => {
    beforeEach(() => {
      // Navigate to awaiting_user_credentials state
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_EMPTY' });
    });

    it('should accept user credentials and transition to creating_admin_user', () => {
      const credentials = { username: 'admin', password: 'secure123' };
      service.send({ type: 'SUBMIT_CREDENTIALS', data: credentials });
      
      expect(service.getSnapshot().value).toBe('creating_admin_user');
      expect(service.getSnapshot().context.userCredentials).toEqual(credentials);
      expect(service.getSnapshot().context.statusMessage).toBe('Creating admin user...');
    });

    it('should transition to seeding_db after successful user creation', () => {
      const credentials = { username: 'admin', password: 'secure123' };
      service.send({ type: 'SUBMIT_CREDENTIALS', data: credentials });
      service.send({ type: 'USER_CREATION_SUCCESS' });
      
      expect(service.getSnapshot().value).toBe('seeding_db');
      expect(service.getSnapshot().context.masterUser).toBe('admin');
      expect(service.getSnapshot().context.statusMessage).toBe('Starting database seed...');
    });

    it('should handle user creation errors', () => {
      const credentials = { username: 'admin', password: 'secure123' };
      service.send({ type: 'SUBMIT_CREDENTIALS', data: credentials });
      service.send({ type: 'ERROR', errorMessage: 'User already exists' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('User already exists');
    });

    it('should handle user creation errors with default message', () => {
      const credentials = { username: 'admin', password: 'secure123' };
      service.send({ type: 'SUBMIT_CREDENTIALS', data: credentials });
      service.send({ type: 'ERROR' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('User creation failed');
    });
  });

  describe('Database Seeding Flow', () => {
    beforeEach(() => {
      // Navigate to seeding_db state
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_EMPTY' });
      service.send({ type: 'SUBMIT_CREDENTIALS', data: { username: 'admin', password: 'secure123' } });
      service.send({ type: 'USER_CREATION_SUCCESS' });
    });

    it('should be in seeding_db state with correct message', () => {
      expect(service.getSnapshot().value).toBe('seeding_db');
      expect(service.getSnapshot().context.statusMessage).toBe('Starting database seed...');
    });

    it('should transition to building_caches after seeding complete', () => {
      service.send({ type: 'SEEDING_COMPLETE' });
      
      expect(service.getSnapshot().value).toEqual({ building_caches: 'building_facts_cache' });
      expect(service.getSnapshot().context.statusMessage).toBe('Building entity-facts cache...');
    });

    it('should transition to building_caches when seeding is skipped', () => {
      service.send({ type: 'SEEDING_SKIPPED' });
      
      expect(service.getSnapshot().value).toEqual({ building_caches: 'building_facts_cache' });
      expect(service.getSnapshot().context.statusMessage).toBe('Building entity-facts cache...');
    });

    it('should handle seeding errors', () => {
      service.send({ type: 'ERROR', errorMessage: 'Invalid seed data' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Invalid seed data');
    });

    it('should handle seeding errors with default message', () => {
      service.send({ type: 'ERROR' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Seeding failed');
    });
  });

  describe('Cache Building Flow', () => {
    beforeEach(() => {
      // Navigate to building_caches state
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_EMPTY' });
      service.send({ type: 'SUBMIT_CREDENTIALS', data: { username: 'admin', password: 'secure123' } });
      service.send({ type: 'USER_CREATION_SUCCESS' });
      service.send({ type: 'SEEDING_COMPLETE' });
    });

    it('should start with building_facts_cache substate', () => {
      expect(service.getSnapshot().value).toEqual({ building_caches: 'building_facts_cache' });
      expect(service.getSnapshot().context.statusMessage).toBe('Building entity-facts cache...');
    });

    it('should transition through cache building substates', () => {
      // Facts cache complete
      service.send({ type: 'FACTS_CACHE_COMPLETE' });
      expect(service.getSnapshot().value).toEqual({ building_caches: 'building_lineage_cache' });
      expect(service.getSnapshot().context.statusMessage).toBe('Building entity-lineage cache...');
      expect(service.getSnapshot().context.cacheResults.facts).toBe('success');
      
      // Lineage cache complete
      service.send({ type: 'LINEAGE_CACHE_COMPLETE' });
      expect(service.getSnapshot().value).toEqual({ building_caches: 'building_subtypes_cache' });
      expect(service.getSnapshot().context.statusMessage).toBe('Building entity-subtypes cache...');
      expect(service.getSnapshot().context.cacheResults.lineage).toBe('success');
      
      // Subtypes cache complete
      service.send({ type: 'SUBTYPES_CACHE_COMPLETE' });
      expect(service.getSnapshot().value).toEqual({ building_caches: 'building_caches_complete' });
      expect(service.getSnapshot().context.statusMessage).toBe('...finished building entity-subtypes cache.');
      expect(service.getSnapshot().context.cacheResults.subtypes).toBe('success');
    });

    it('should transition to setup_complete after all caches are built', () => {
      // Complete all cache building steps
      service.send({ type: 'FACTS_CACHE_COMPLETE' });
      service.send({ type: 'LINEAGE_CACHE_COMPLETE' });
      service.send({ type: 'SUBTYPES_CACHE_COMPLETE' });
      service.send({ type: 'CACHE_BUILD_COMPLETE' });
      
      expect(service.getSnapshot().value).toBe('setup_complete');
      expect(service.getSnapshot().context.statusMessage).toBe('Setup complete.');
    });

    it('should handle facts cache build errors', () => {
      service.send({ type: 'ERROR', errorMessage: 'Facts cache build failed' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Facts cache build failed');
      expect(service.getSnapshot().context.cacheResults.facts).toBe('failed');
    });

    it('should handle lineage cache build errors', () => {
      service.send({ type: 'FACTS_CACHE_COMPLETE' });
      service.send({ type: 'ERROR', errorMessage: 'Lineage cache error' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Lineage cache error');
      expect(service.getSnapshot().context.cacheResults.lineage).toBe('failed');
    });

    it('should handle subtypes cache build errors', () => {
      service.send({ type: 'FACTS_CACHE_COMPLETE' });
      service.send({ type: 'LINEAGE_CACHE_COMPLETE' });
      service.send({ type: 'ERROR', errorMessage: 'Subtypes cache error' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Subtypes cache error');
      expect(service.getSnapshot().context.cacheResults.subtypes).toBe('failed');
    });

    it('should use default error messages for cache errors', () => {
      service.send({ type: 'ERROR' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Facts cache build failed');
      expect(service.getSnapshot().context.cacheResults.facts).toBe('failed');
    });
  });

  describe('Error Recovery', () => {
    it('should allow restarting from error state', () => {
      // Cause an error
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'ERROR', errorMessage: 'Test error' });
      
      expect(service.getSnapshot().value).toBe('error');
      expect(service.getSnapshot().context.errorMessage).toBe('Test error');
      
      // Restart
      service.send({ type: 'START_SETUP' });
      
      expect(service.getSnapshot().value).toBe('idle');
      expect(service.getSnapshot().context.errorMessage).toBeUndefined();
      expect(service.getSnapshot().context.statusMessage).toBe('Idle');
    });
  });

  describe('Final State', () => {
    it('should mark setup_complete as final state', () => {
      // Navigate to setup_complete through database not empty path
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_NOT_EMPTY' });
      
      expect(service.getSnapshot().value).toBe('setup_complete');
      expect(service.getSnapshot().context.statusMessage).toBe('Setup complete.');
      expect(service.getSnapshot().status).toBe('done');
    });

    it('should complete through full flow', () => {
      // Complete full setup flow
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_EMPTY' });
      service.send({ type: 'SUBMIT_CREDENTIALS', data: { username: 'admin', password: 'secure123' } });
      service.send({ type: 'USER_CREATION_SUCCESS' });
      service.send({ type: 'SEEDING_COMPLETE' });
      service.send({ type: 'FACTS_CACHE_COMPLETE' });
      service.send({ type: 'LINEAGE_CACHE_COMPLETE' });
      service.send({ type: 'SUBTYPES_CACHE_COMPLETE' });
      service.send({ type: 'CACHE_BUILD_COMPLETE' });
      
      expect(service.getSnapshot().value).toBe('setup_complete');
      expect(service.getSnapshot().status).toBe('done');
      expect(service.getSnapshot().context.masterUser).toBe('admin');
      expect(service.getSnapshot().context.cacheResults).toEqual({
        facts: 'success',
        lineage: 'success',
        subtypes: 'success'
      });
    });
  });

  describe('Context Updates', () => {
    it('should preserve context data through state transitions', () => {
      const credentials = { username: 'testuser', password: 'testpass' };
      
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_EMPTY' });
      service.send({ type: 'SUBMIT_CREDENTIALS', data: credentials });
      service.send({ type: 'USER_CREATION_SUCCESS' });
      
      const context = service.getSnapshot().context;
      expect(context.userCredentials).toEqual(credentials);
      expect(context.masterUser).toBe('testuser');
      expect(context.dbCheckResult).toBe('empty');
    });

    it('should accumulate cache results correctly', () => {
      // Navigate to cache building
      service.send({ type: 'START_SETUP' });
      service.send({ type: 'DB_CHECK_COMPLETE_EMPTY' });
      service.send({ type: 'SUBMIT_CREDENTIALS', data: { username: 'admin', password: 'secure123' } });
      service.send({ type: 'USER_CREATION_SUCCESS' });
      service.send({ type: 'SEEDING_COMPLETE' });
      
      // Build caches one by one and check accumulation
      service.send({ type: 'FACTS_CACHE_COMPLETE' });
      expect(service.getSnapshot().context.cacheResults).toEqual({ facts: 'success' });
      
      service.send({ type: 'LINEAGE_CACHE_COMPLETE' });
      expect(service.getSnapshot().context.cacheResults).toEqual({ 
        facts: 'success', 
        lineage: 'success' 
      });
      
      service.send({ type: 'SUBTYPES_CACHE_COMPLETE' });
      expect(service.getSnapshot().context.cacheResults).toEqual({ 
        facts: 'success', 
        lineage: 'success', 
        subtypes: 'success' 
      });
    });
  });
});