import { z } from 'zod';

// System event constants - events sent FROM portal TO knowledge-integrator
export const PortalSystemEvents = {
  LOADED_FACTS: 'system:loadedFacts',
  UNLOADED_FACTS: 'system:unloadedFacts',
  SELECTED_ENTITY: 'system:selectedEntity',
  SELECTED_FACT: 'system:selectedFact',
  SELECTED_NONE: 'system:selectedNone',
  ENTITIES_CLEARED: 'system:entitiesCleared',
  STATE_INITIALIZED: 'system:stateInitialized',
  STATE_CHANGED: 'system:stateChanged',
  LOADED_MODELS: 'system:loadedModels',
  UNLOADED_MODELS: 'system:unloadedModels',
  UPDATE_CATEGORY_DESCENDANTS_CACHE: 'system:updateCategoryDescendantsCache',
} as const;

// Event payload schemas
export const LoadedFactsEventSchema = z.object({
  facts: z.array(z.any()), // Facts will be typed more specifically later
});

export const UnloadedFactsEventSchema = z.object({
  fact_uids: z.array(z.union([z.string(), z.number()])),
});

export const SelectedEntityEventSchema = z.object({
  uid: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
});

export const SelectedFactEventSchema = z.object({
  uid: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
});

export const SelectedNoneEventSchema = z.object({
  userId: z.string().optional(),
});

export const EntitiesClearedEventSchema = z.object({
  userId: z.string().optional(),
});

export const StateInitializedEventSchema = z.object({
  mainstate: z.string(),
  state: z.any(),
});

export const StateChangedEventSchema = z.object({
  mainstate: z.string(),
  state: z.any(),
});

export const LoadedModelsEventSchema = z.object({
  models: z.array(z.object({
    uid: z.union([z.string(), z.number()]),
    // Additional model properties as needed
  })),
});

export const UnloadedModelsEventSchema = z.object({
  model_uids: z.array(z.union([z.string(), z.number()])),
});

export const UpdateCategoryDescendantsCacheEventSchema = z.object({
  // Category cache update event payload
});

// Type exports
export type LoadedFactsEvent = z.infer<typeof LoadedFactsEventSchema>;
export type UnloadedFactsEvent = z.infer<typeof UnloadedFactsEventSchema>;
export type SelectedEntityEvent = z.infer<typeof SelectedEntityEventSchema>;
export type SelectedFactEvent = z.infer<typeof SelectedFactEventSchema>;
export type SelectedNoneEvent = z.infer<typeof SelectedNoneEventSchema>;
export type EntitiesClearedEvent = z.infer<typeof EntitiesClearedEventSchema>;
export type StateInitializedEvent = z.infer<typeof StateInitializedEventSchema>;
export type StateChangedEvent = z.infer<typeof StateChangedEventSchema>;
export type LoadedModelsEvent = z.infer<typeof LoadedModelsEventSchema>;
export type UnloadedModelsEvent = z.infer<typeof UnloadedModelsEventSchema>;
export type UpdateCategoryDescendantsCacheEvent = z.infer<typeof UpdateCategoryDescendantsCacheEventSchema>;

// Event type union
export type PortalSystemEventType = typeof PortalSystemEvents[keyof typeof PortalSystemEvents];