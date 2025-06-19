import { z } from 'zod';

// Action constants matching Clojure implementation
export const SpecializationActions = {
  SPECIALIZATION_FACT_GET: 'archivist.specialization/fact-get',
  SPECIALIZATION_HIERARCHY_GET: 'archivist.specialization/hierarchy-get',
} as const;

// Request schemas
export const SpecializationFactGetRequestSchema = z.object({
  uid: z.number(),
  'user-id': z.number().optional(),
});

export const SpecializationHierarchyGetRequestSchema = z.object({
  uid: z.number(),
  'user-id': z.number().optional(),
});

// Response schemas
export const SpecializationFactGetResponseSchema = z.object({
  facts: z.array(z.any()),
});

export const SpecializationHierarchyGetResponseSchema = z.object({
  facts: z.array(z.any()),
  concepts: z.array(z.any()),
});

// Type exports
export type SpecializationFactGetRequest = z.infer<typeof SpecializationFactGetRequestSchema>;
export type SpecializationFactGetResponse = z.infer<typeof SpecializationFactGetResponseSchema>;
export type SpecializationHierarchyGetRequest = z.infer<typeof SpecializationHierarchyGetRequestSchema>;
export type SpecializationHierarchyGetResponse = z.infer<typeof SpecializationHierarchyGetResponseSchema>;