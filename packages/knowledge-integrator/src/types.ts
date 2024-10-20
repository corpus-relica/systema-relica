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
  partial_definition: string;
  full_definition: string;
  valid_ctx_uid?: number;
  valid_ctx_name?: string;
};

export type Concept = {
  uid: number;
  descendants: Array<number>;
};

export interface nodeData {
  id: number;
  name: string;
  val: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface edgeData {
  source: number;
  target: number;
  label: number;
  id: number;
}

export interface ChatMessage {
  role: "function" | "system" | "user" | "assistant";
  content: string;
}
