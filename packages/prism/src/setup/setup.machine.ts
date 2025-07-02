import { createActor, createMachine, assign } from 'xstate';

export interface SetupContext {
  masterUser?: string;
  errorMessage?: string;
  statusMessage: string;
  dbCheckResult?: 'empty' | 'not-empty' | 'error';
  userCredentials?: {
    username: string;
    email: string;
    password: string;
  };
  seedFiles: string[];
  processedCsvFiles: string[];
  cacheResults: {
    facts?: 'success' | 'failed';
    lineage?: 'success' | 'failed';
    subtypes?: 'success' | 'failed';
  };
}

export type SetupEvent =
  | { type: 'START_SETUP' }
  | { type: 'DB_CHECK_COMPLETE_EMPTY' }
  | { type: 'DB_CHECK_COMPLETE_NOT_EMPTY' }
  | { type: 'SUBMIT_CREDENTIALS'; data: { username: string; email:string, password: string } }
  | { type: 'USER_CREATION_SUCCESS' }
  | { type: 'USER_CREATION_ERROR'; errorMessage: string }
  | { type: 'SEEDING_COMPLETE' }
  | { type: 'SEEDING_SKIPPED' }
  | { type: 'FACTS_CACHE_COMPLETE' }
  | { type: 'LINEAGE_CACHE_COMPLETE' }
  | { type: 'SUBTYPES_CACHE_COMPLETE' }
  | { type: 'CACHE_BUILD_COMPLETE' }
  | { type: 'ERROR'; errorMessage?: string };

export const setupMachine = createMachine({
  id: 'prism-setup',
  initial: 'idle',
  context: {
    masterUser: undefined,
    errorMessage: undefined,
    statusMessage: 'Idle',
    dbCheckResult: undefined,
    userCredentials: undefined,
    seedFiles: [],
    processedCsvFiles: [],
    cacheResults: {},
  } as SetupContext,
  states: {
    idle: {
      entry: assign({
        statusMessage: 'Idle',
      }),
      on: {
        START_SETUP: {
          target: 'checking_db',
        },
      },
    },
    
    checking_db: {
      entry: assign({
        statusMessage: 'Checking database state...',
      }),
      on: {
        DB_CHECK_COMPLETE_EMPTY: {
          target: 'awaiting_user_credentials',
          actions: assign({
            dbCheckResult: 'empty',
          }),
        },
        DB_CHECK_COMPLETE_NOT_EMPTY: {
          target: 'setup_complete',
          actions: assign({
            dbCheckResult: 'not-empty',
            statusMessage: 'Database already contains data.',
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            dbCheckResult: 'error',
            errorMessage: ({ event }) => event.errorMessage || 'Database check failed',
          }),
        },
      },
    },
    
    awaiting_user_credentials: {
      entry: assign({
        statusMessage: 'Awaiting admin user credentials...',
        errorMessage: undefined,  // Clear any previous error message
      }),
      on: {
        SUBMIT_CREDENTIALS: {
          target: 'creating_admin_user',
          actions: assign({
            userCredentials: ({ event }) => event.data,
            errorMessage: undefined,  // Clear error when resubmitting
          }),
        },
      },
    },
    
    creating_admin_user: {
      entry: assign({
        statusMessage: 'Creating admin user...',
        errorMessage: undefined,  // Clear any previous error
      }),
      on: {
        USER_CREATION_SUCCESS: {
          target: 'seeding_db',
          actions: assign({
            masterUser: ({ context }) => context.userCredentials?.username,
          }),
        },
        USER_CREATION_ERROR: {
          target: 'awaiting_user_credentials',
          actions: assign({
            statusMessage: ({ event }) => event.errorMessage,
            // Don't set errorMessage here - that's for the error state
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            errorMessage: ({ event }) => event.errorMessage || 'User creation failed',
          }),
        },
      },
    },
    
    seeding_db: {
      entry: assign({
        statusMessage: 'Starting database seed...',
      }),
      on: {
        SEEDING_COMPLETE: {
          target: 'building_caches',
          actions: assign({
            statusMessage: 'DB seeding complete.',
          }),
        },
        SEEDING_SKIPPED: {
          target: 'building_caches',
          actions: assign({
            statusMessage: 'Seeding skipped (no files?)',
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            errorMessage: ({ event }) => event.errorMessage || 'Seeding failed',
          }),
        },
      },
    },
    
    building_caches: {
      initial: 'building_facts_cache',
      states: {
        building_facts_cache: {
          entry: assign({
            statusMessage: 'Building entity-facts cache...',
          }),
          on: {
            FACTS_CACHE_COMPLETE: {
              target: 'building_lineage_cache',
              actions: assign({
                statusMessage: '...finished building entity-facts cache.',
                cacheResults: ({ context }) => ({
                  ...context.cacheResults,
                  facts: 'success' as const,
                }),
              }),
            },
            ERROR: {
              target: '#prism-setup.error',
              actions: assign({
                errorMessage: ({ event }) => event.errorMessage || 'Facts cache build failed',
                cacheResults: ({ context }) => ({
                  ...context.cacheResults,
                  facts: 'failed' as const,
                }),
              }),
            },
          },
        },
        
        building_lineage_cache: {
          entry: assign({
            statusMessage: 'Building entity-lineage cache...',
          }),
          on: {
            LINEAGE_CACHE_COMPLETE: {
              target: 'building_subtypes_cache',
              actions: assign({
                statusMessage: '...finished building entity-lineage cache.',
                cacheResults: ({ context }) => ({
                  ...context.cacheResults,
                  lineage: 'success' as const,
                }),
              }),
            },
            ERROR: {
              target: '#prism-setup.error',
              actions: assign({
                errorMessage: ({ event }) => event.errorMessage || 'Lineage cache build failed',
                cacheResults: ({ context }) => ({
                  ...context.cacheResults,
                  lineage: 'failed' as const,
                }),
              }),
            },
          },
        },
        
        building_subtypes_cache: {
          entry: assign({
            statusMessage: 'Building entity-subtypes cache...',
          }),
          on: {
            SUBTYPES_CACHE_COMPLETE: {
              target: 'building_caches_complete',
              actions: assign({
                statusMessage: '...finished building entity-subtypes cache.',
                cacheResults: ({ context }) => ({
                  ...context.cacheResults,
                  subtypes: 'success' as const,
                }),
              }),
            },
            ERROR: {
              target: '#prism-setup.error',
              actions: assign({
                errorMessage: ({ event }) => event.errorMessage || 'Subtypes cache build failed',
                cacheResults: ({ context }) => ({
                  ...context.cacheResults,
                  subtypes: 'failed' as const,
                }),
              }),
            },
          },
        },
        
        building_caches_complete: {
          on: {
            CACHE_BUILD_COMPLETE: {
              target: '#prism-setup.setup_complete',
              actions: assign({
                statusMessage: '...finished building caches.',
              }),
            },
          },
        },
      },
    },
    
    setup_complete: {
      entry: assign({
        statusMessage: 'Setup complete.',
      }),
      type: 'final',
    },
    
    error: {
      entry: assign({
        statusMessage: ({ context }) => `Error: ${context.errorMessage}`,
      }),
      on: {
        START_SETUP: {
          target: 'idle',
          actions: assign({
            errorMessage: undefined,
            statusMessage: 'Idle',
          }),
        },
      },
    },
  },
});

export function createSetupActor() {
  return createActor(setupMachine);
}
