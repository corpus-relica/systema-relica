import { z } from "zod";

// User action constants - actions sent FROM knowledge-integrator TO portal
export const PortalUserActions = {
  SELECT_ENTITY: "user:selectEntity",
  SELECT_FACT: "user:selectFact",
  SELECT_NONE: "user:selectNone",
  LOAD_SPECIALIZATION_HIERARCHY: "user:loadSpecializationHierarchy",
  CLEAR_ENTITIES: "user:clearEntities",
  LOAD_ALL_RELATED_FACTS: "user:loadAllRelatedFacts",
  LOAD_SUBTYPES_CONE: "user:loadSubtypesCone",
  UNLOAD_SUBTYPES_CONE: "user:unloadSubtypesCone",
  DELETE_ENTITY: "user:deleteEntity",
  DELETE_FACT: "user:deleteFact",
  LOAD_ENTITY: "user:loadEntity",
  LOAD_ENTITIES: "user:loadEntities",
  UNLOAD_ENTITY: "user:unloadEntity",
  UNLOAD_ENTITIES: "user:unloadEntities",
  GET_SPECIALIZATION_HIERARCHY: "user:getSpecializationHierarchy",
  CHAT_USER_INPUT: "user:chatUserInput",
} as const;

// Request schemas for user actions
export const SelectEntityRequestSchema = z.object({
  userId: z.number(),
  environmentId: z.string(),
  uid: z.number(),
});

export const SelectFactRequestSchema = z.object({
  uid: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
});

export const SelectNoneRequestSchema = z.object({
  userId: z.string().optional(),
});

export const LoadSpecializationHierarchyRequestSchema = z.object({
  uid: z.number(),
  userId: z.number(),
  environmentId: z.string().optional(),
});

export const LoadEntityRequestSchema = z.object({
  uid: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
});

export const ClearEntitiesRequestSchema = z.object({
  userId: z.number(),
  environmentId: z.string(), // Optional for environments
});

export const LoadAllRelatedFactsRequestSchema = z.object({
  uid: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
});

export const LoadSubtypesConeRequestSchema = z.object({
  uid: z.number(),
  userId: z.number(),
  environmentId: z.string(),
});

export const UnloadEntityRequestSchema = z.object({
  uid: z.number(),
  userId: z.number(),
  environmentId: z.string().optional(),
});

export const UnloadSubtypesConeRequestSchema = z.object({
  uid: z.number(),
  userId: z.number(),
  environmentId: z.string().optional(),
});

export const DeleteEntityRequestSchema = z.object({
  uid: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
});

export const DeleteFactRequestSchema = z.object({
  uid: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
});

export const LoadEntitiesRequestSchema = z.object({
  uids: z.array(z.number()),
  userId: z.number(),
  environmentId: z.string().optional(),
});

export const UnloadEntitiesRequestSchema = z.object({
  uids: z.array(z.union([z.string(), z.number()])),
  userId: z.number(),
  environmentId: z.string(),
});

export const GetSpecializationHierarchyRequestSchema = z.object({
  uid: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
});

// Response schemas for user actions
export const StandardResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z
    .object({
      code: z.string(),
      type: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  data: z.any().optional(),
});

// Type exports
export type SelectEntityRequest = z.infer<typeof SelectEntityRequestSchema>;
export type SelectFactRequest = z.infer<typeof SelectFactRequestSchema>;
export type SelectNoneRequest = z.infer<typeof SelectNoneRequestSchema>;
export type LoadSpecializationHierarchyRequest = z.infer<
  typeof LoadSpecializationHierarchyRequestSchema
>;
export type LoadEntityRequest = z.infer<typeof LoadEntityRequestSchema>;
export type ClearEntitiesRequest = z.infer<typeof ClearEntitiesRequestSchema>;
export type LoadAllRelatedFactsRequest = z.infer<
  typeof LoadAllRelatedFactsRequestSchema
>;
export type LoadSubtypesConeRequest = z.infer<
  typeof LoadSubtypesConeRequestSchema
>;
export type UnloadEntityRequest = z.infer<typeof UnloadEntityRequestSchema>;
export type UnloadSubtypesConeRequest = z.infer<
  typeof UnloadSubtypesConeRequestSchema
>;
export type DeleteEntityRequest = z.infer<typeof DeleteEntityRequestSchema>;
export type DeleteFactRequest = z.infer<typeof DeleteFactRequestSchema>;
export type LoadEntitiesRequest = z.infer<typeof LoadEntitiesRequestSchema>;
export type UnloadEntitiesRequest = z.infer<typeof UnloadEntitiesRequestSchema>;
export type GetSpecializationHierarchyRequest = z.infer<
  typeof GetSpecializationHierarchyRequestSchema
>;
export type StandardResponse = z.infer<typeof StandardResponseSchema>;

// Action type union
export type PortalUserActionType =
  (typeof PortalUserActions)[keyof typeof PortalUserActions];
