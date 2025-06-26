/**
 * Semantic constants and mappings ported from Clojure implementation
 * These constants define the semantic relationships and categories used
 * throughout the Clarity semantic modeling system.
 */

// Quintessential Model Category UIDs (matching Clojure and existing TypeScript)
export const QUINTESSENTIAL_MODEL_UIDS = {
  PHYSICAL_OBJECT: 730044,
  ASPECT: 790229,
  ROLE: 160170,
  RELATION: 2850,
  OCCURRENCE: 193671,
} as const;

// Category Names (matching Clojure implementation)
export const CATEGORY_CONSTANTS = {
  PHYSICAL_OBJECT: 'physical object',
  ASPECT: 'aspect',
  ROLE: 'role',
  RELATION: 'relation',
  OCCURRENCE: 'occurrence',
  STATE: 'state',
  ANYTHING: 'anything',
} as const;

// Entity Nature Constants
export const ENTITY_NATURE = {
  KIND: 'kind',
  INDIVIDUAL: 'individual',
  QUALIFICATION: 'qualification',
} as const;

// Semantic Relationship UIDs (matching Clojure implementation)
export const RELATION_UID_TO_SEMANTIC = {
  1146: 'specialization-of',
  1225: 'classification',
  1981: 'synonym',
  1986: 'inverse',
  4731: 'required-role-1',
  4733: 'required-role-2',
  4714: 'possible-role',
  5025: 'value',
  5644: 'involves',
} as const;

// Reverse mapping for semantic relationships to UIDs
export const SEMANTIC_TO_RELATION_UID = Object.fromEntries(
  Object.entries(RELATION_UID_TO_SEMANTIC).map(([uid, semantic]) => [
    semantic,
    parseInt(uid),
  ]),
) as Record<string, number>;

// Temporal aspect relation UIDs
export const TEMPORAL_RELATIONS = {
  BEGIN_TIME: 'begin time',
  END_TIME: 'end time',
  DURATION: 'duration',
} as const;

// Causality relation UIDs
export const CAUSALITY_RELATIONS = {
  CAUSED_BY: 'caused by',
  CAUSES: 'causes',
} as const;

// Category to namespace mapping (for spec validation if needed)
export const CATEGORY_TO_SPEC = {
  [CATEGORY_CONSTANTS.PHYSICAL_OBJECT]: 'physical-object',
  [CATEGORY_CONSTANTS.ASPECT]: 'aspect',
  [CATEGORY_CONSTANTS.ROLE]: 'role',
  [CATEGORY_CONSTANTS.RELATION]: 'relation',
  [CATEGORY_CONSTANTS.OCCURRENCE]: 'occurrence',
  [CATEGORY_CONSTANTS.STATE]: 'state',
} as const;

// Common relation name patterns for filtering facts
export const RELATION_NAME_PATTERNS = {
  HAS_ASPECT: 'has aspect',
  PLAYS_ROLE: 'plays role',
  PART_OF: 'part of',
  CONNECTED: 'connected',
  UNIT_OF_MEASURE: 'unit of measure',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  ENTITY_NOT_FOUND: 'Entity not found',
  INVALID_ENTITY_TYPE: 'Invalid entity type',
  INVALID_CATEGORY: 'Invalid category',
  RETRIEVAL_FAILED: 'Failed to retrieve entity data',
  UNKNOWN_ENTITY_NATURE: 'Unknown entity nature',
} as const;

// Type definitions for better type safety
export type CategoryConstant =
  (typeof CATEGORY_CONSTANTS)[keyof typeof CATEGORY_CONSTANTS];
export type EntityNature = (typeof ENTITY_NATURE)[keyof typeof ENTITY_NATURE];
export type SemanticRelation =
  (typeof RELATION_UID_TO_SEMANTIC)[keyof typeof RELATION_UID_TO_SEMANTIC];
export type RelationUID = keyof typeof RELATION_UID_TO_SEMANTIC;
