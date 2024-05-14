export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface NodeData {
  id: number;
  name: string;
  val: number;
  pos?: Position;
}

export interface EdgeData {
  id: number;
  type: number;
  label: string;
  source: number;
  target: number;
  sourcePos?: Position;
  targetPos?: Position;
}

export type Fact = {
  fact_uid: number;
  language_uid: number;
  language: string;
  collection_uid: string;
  collection_name: string;
  lh_context_uid: number;
  lh_context_name: string;
  lh_object_uid: number;
  lh_object_name: string;
  rel_type_uid: number;
  rel_type_name: string;
  rh_object_uid: number;
  rh_object_name: string;
  author: string;
  effective_from: string;
  latest_update: string;
  approval_status: string;
  reference: string;
  sequence: string;
  partial_definiton: string;
  full_definition: string;
};
