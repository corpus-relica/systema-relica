export interface TraversalConfig {
  direction?: 'outgoing' | 'incoming' | 'both';
  edgeType?: number | number[];
  includeSubtypes?: boolean;
  maxDepth?: number;
  filterFn?: (fact: any) => boolean;
}

export interface TraversalResult {
  facts: any[];
  depth: number;
  path: number[];
}

export interface RoleInfo {
  role_uid: number;
  required_for_relation: number;
  inheritance_distance: number;
  can_inherit?: boolean;
}

export interface RelationValidation {
  is_valid: boolean;
  missing_roles?: number[];
  incompatible_roles?: number[];
  message?: string;
}

export type SetOperation = 'union' | 'intersection' | 'difference';

export interface FactSetResult {
  facts: any[];
  operation_applied: SetOperation;
  source_sets: number;
}