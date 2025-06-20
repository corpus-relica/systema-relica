import { z } from 'zod';

// Aperture WebSocket Actions - based on Clojure implementation
export const ApertureActions = {
  // Environment Operations
  ENVIRONMENT_GET: 'aperture.environment/get',
  ENVIRONMENT_LIST: 'aperture.environment/list', 
  ENVIRONMENT_CREATE: 'aperture.environment/create',
  ENVIRONMENT_CLEAR: 'aperture.environment/clear',

  // Search Operations
  SEARCH_LOAD_TEXT: 'aperture.search/load-text',
  SEARCH_LOAD_UID: 'aperture.search/load-uid',

  // Specialization Operations
  SPECIALIZATION_LOAD_FACT: 'aperture.specialization/load-fact',
  SPECIALIZATION_LOAD: 'aperture.specialization/load',

  // Entity Operations
  ENTITY_LOAD: 'aperture.entity/load',
  ENTITY_UNLOAD: 'aperture.entity/unload',
  ENTITY_LOAD_MULTIPLE: 'aperture.entity/load-multiple',
  ENTITY_UNLOAD_MULTIPLE: 'aperture.entity/unload-multiple',
  SELECT_ENTITY: 'aperture.entity/select',
  ENTITY_DESELECT: 'aperture.entity/deselect',

  // Subtype Operations
  SUBTYPE_LOAD: 'aperture.subtype/load',
  SUBTYPE_LOAD_CONE: 'aperture.subtype/load-cone',
  SUBTYPE_UNLOAD_CONE: 'aperture.subtype/unload-cone',

  // Classification Operations
  CLASSIFICATION_LOAD: 'aperture.classification/load',
  CLASSIFICATION_LOAD_FACT: 'aperture.classification/load-fact',

  // Composition Operations
  COMPOSITION_LOAD: 'aperture.composition/load',
  COMPOSITION_LOAD_IN: 'aperture.composition/load-in',

  // Connection Operations
  CONNECTION_LOAD: 'aperture.connection/load',
  CONNECTION_LOAD_IN: 'aperture.connection/load-in',

  // Relation Operations
  RELATION_REQUIRED_ROLES_LOAD: 'aperture.relation/required-roles-load',
  RELATION_ROLE_PLAYERS_LOAD: 'aperture.relation/role-players-load',

  // Fact-related Events
  FACTS_LOADED: 'aperture.facts/loaded',
  FACTS_UNLOADED: 'aperture.facts/unloaded',
} as const;

export const ApertureEvents = {
  LOADED_FACTS: 'aperture.facts/loaded',
  UNLOADED_FACTS: 'aperture.facts/unloaded',
  ENTITY_SELECTED: 'aperture.entity/selected',
  ENTITY_DESELECTED: 'aperture.entity/deselected',
  // SELECTED_FACT: 'system:selectedFact',
  // SELECTED_NONE: 'system:selectedNone',
  // ENTITIES_CLEARED: 'system:entitiesCleared',
  // STATE_INITIALIZED: 'system:stateInitialized',
  // STATE_CHANGED: 'system:stateChanged',
  // LOADED_MODELS: 'system:loadedModels',
  // UNLOADED_MODELS: 'system:unloadedModels',
  // UPDATE_CATEGORY_DESCENDANTS_CACHE: 'system:updateCategoryDescendantsCache',
} as const;

// Base schemas
const BaseUserPayloadSchema = z.object({
  'user-id': z.number(),
});

const BaseEnvironmentPayloadSchema = BaseUserPayloadSchema.extend({
  'environment-id': z.number().optional(),
});

const BaseEntityPayloadSchema = BaseEnvironmentPayloadSchema.extend({
  'entity-uid': z.number(),
});

// Environment Operations
export const EnvironmentGetRequestSchema = BaseEnvironmentPayloadSchema;
export const EnvironmentListRequestSchema = BaseUserPayloadSchema;
export const EnvironmentCreateRequestSchema = BaseUserPayloadSchema.extend({
  name: z.string(),
});
export const EnvironmentClearRequestSchema = BaseEnvironmentPayloadSchema;

// Search Operations
export const SearchLoadTextRequestSchema = BaseUserPayloadSchema.extend({
  term: z.string(),
});

export const SearchLoadUidRequestSchema = BaseUserPayloadSchema.extend({
  uid: z.number(),
});

// Specialization Operations
export const SpecializationLoadFactRequestSchema = BaseEnvironmentPayloadSchema.extend({
  uid: z.number(),
});

export const SpecializationLoadRequestSchema = BaseEnvironmentPayloadSchema.extend({
  uid: z.number(),
});

// Entity Operations
export const EntityLoadRequestSchema = BaseEntityPayloadSchema;
export const EntityUnloadRequestSchema = BaseEntityPayloadSchema;
export const EntitySelectRequestSchema = BaseEntityPayloadSchema;
export const EntityDeselectRequestSchema = BaseEnvironmentPayloadSchema;

export const EntityLoadMultipleRequestSchema = BaseEnvironmentPayloadSchema.extend({
  'entity-uids': z.array(z.number()),
});

export const EntityUnloadMultipleRequestSchema = BaseEnvironmentPayloadSchema.extend({
  'entity-uids': z.array(z.number()),
});

// Subtype Operations
export const SubtypeLoadRequestSchema = BaseEntityPayloadSchema;
export const SubtypeLoadConeRequestSchema = BaseEntityPayloadSchema;
export const SubtypeUnloadConeRequestSchema = BaseEntityPayloadSchema;

// Classification Operations
export const ClassificationLoadRequestSchema = BaseEntityPayloadSchema;
export const ClassificationLoadFactRequestSchema = BaseEntityPayloadSchema;

// Composition Operations
export const CompositionLoadRequestSchema = BaseEntityPayloadSchema;
export const CompositionLoadInRequestSchema = BaseEntityPayloadSchema;

// Connection Operations
export const ConnectionLoadRequestSchema = BaseEntityPayloadSchema;
export const ConnectionLoadInRequestSchema = BaseEntityPayloadSchema;

// Relation Operations
export const RelationRequiredRolesLoadRequestSchema = BaseEnvironmentPayloadSchema.extend({
  uid: z.number(),
});

export const RelationRolePlayersLoadRequestSchema = BaseEnvironmentPayloadSchema.extend({
  uid: z.number(),
});

// Response schemas
const FactSchema = z.object({
  fact_uid: z.number(),
  lh_object_uid: z.number(),
  lh_object_name: z.string(),
  rel_type_uid: z.number(),
  rel_type_name: z.string(),
  rh_object_uid: z.number(),
  rh_object_name: z.string(),
  full_definition: z.string().optional(),
  uom_uid: z.number().optional(),
  uom_name: z.string().optional(),
});

const EnvironmentSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  facts: z.array(FactSchema),
  selected_entity_id: z.number().optional(),
});

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  environment: EnvironmentSchema.optional(),
  facts: z.array(FactSchema).optional(),
  'fact-uids-removed': z.array(z.number()).optional(),
  'model-uids-removed': z.array(z.number()).optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export const ApertureResponseSchema = z.union([SuccessResponseSchema, ErrorResponseSchema]);

// Event schemas
export const FactsLoadedEventSchema = z.object({
  type: z.literal('aperture.facts/loaded'),
  facts: z.array(FactSchema),
  'user-id': z.number(),
  'environment-id': z.number(),
});

export const FactsUnloadedEventSchema = z.object({
  type: z.literal('aperture.facts/unloaded'),
  factUids: z.array(z.number()),
  modelUids: z.array(z.number()).optional(),
  userId: z.number(),
  environmentId: z.number(),
});

export const EntitySelectedEventSchema = z.object({
  type: z.literal('aperture.entity/selected'),
  'entity-uid': z.number(),
  'user-id': z.number(),
  'environment-id': z.number(),
});

export const EntityDeselectedEventSchema = z.object({
  type: z.literal('aperture.entity/deselected'),
  'user-id': z.number(),
  'environment-id': z.number(),
});

// Type exports
export type EnvironmentGetRequest = z.infer<typeof EnvironmentGetRequestSchema>;
export type EnvironmentListRequest = z.infer<typeof EnvironmentListRequestSchema>;
export type EnvironmentCreateRequest = z.infer<typeof EnvironmentCreateRequestSchema>;
export type EnvironmentClearRequest = z.infer<typeof EnvironmentClearRequestSchema>;

export type SearchLoadTextRequest = z.infer<typeof SearchLoadTextRequestSchema>;
export type SearchLoadUidRequest = z.infer<typeof SearchLoadUidRequestSchema>;

export type SpecializationLoadFactRequest = z.infer<typeof SpecializationLoadFactRequestSchema>;
export type SpecializationLoadRequest = z.infer<typeof SpecializationLoadRequestSchema>;

export type EntityLoadRequest = z.infer<typeof EntityLoadRequestSchema>;
export type EntityUnloadRequest = z.infer<typeof EntityUnloadRequestSchema>;
export type EntitySelectRequest = z.infer<typeof EntitySelectRequestSchema>;
export type EntityDeselectRequest = z.infer<typeof EntityDeselectRequestSchema>;
export type EntityLoadMultipleRequest = z.infer<typeof EntityLoadMultipleRequestSchema>;
export type EntityUnloadMultipleRequest = z.infer<typeof EntityUnloadMultipleRequestSchema>;

export type SubtypeLoadRequest = z.infer<typeof SubtypeLoadRequestSchema>;
export type SubtypeLoadConeRequest = z.infer<typeof SubtypeLoadConeRequestSchema>;
export type SubtypeUnloadConeRequest = z.infer<typeof SubtypeUnloadConeRequestSchema>;

export type ClassificationLoadRequest = z.infer<typeof ClassificationLoadRequestSchema>;
export type ClassificationLoadFactRequest = z.infer<typeof ClassificationLoadFactRequestSchema>;

export type CompositionLoadRequest = z.infer<typeof CompositionLoadRequestSchema>;
export type CompositionLoadInRequest = z.infer<typeof CompositionLoadInRequestSchema>;

export type ConnectionLoadRequest = z.infer<typeof ConnectionLoadRequestSchema>;
export type ConnectionLoadInRequest = z.infer<typeof ConnectionLoadInRequestSchema>;

export type RelationRequiredRolesLoadRequest = z.infer<typeof RelationRequiredRolesLoadRequestSchema>;
export type RelationRolePlayersLoadRequest = z.infer<typeof RelationRolePlayersLoadRequestSchema>;

export type ApertureResponse = z.infer<typeof ApertureResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export type FactsLoadedEvent = z.infer<typeof FactsLoadedEventSchema>;
export type FactsUnloadedEvent = z.infer<typeof FactsUnloadedEventSchema>;
export type EntitySelectedEvent = z.infer<typeof EntitySelectedEventSchema>;
export type EntityDeselectedEvent = z.infer<typeof EntityDeselectedEventSchema>;

export type Fact = z.infer<typeof FactSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;

export type ApertureActionType = typeof ApertureActions[keyof typeof ApertureActions];
