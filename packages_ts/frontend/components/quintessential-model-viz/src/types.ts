export interface ModelElement {
  uid: number;
  name: string;
  nature: string;
  category?: string;
  definitions?: string[];
  supertypes?: number[];
  possible_kinds_of_roles?: any[][];
  definitive_kinds_of_intrinsic_aspects?: any[];
  definitive_kinds_of_quantitative_aspects?: any[];
  facts?: any[];
}

export interface QuintessentialModel {
  models: ModelElement[];
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface ElementNode {
  id: string;
  position: Position;
  element: ModelElement;
  color: string;
  size: number;
}

export interface ElementLink {
  id: string;
  source: string;
  target: string;
  type: string;
  color: string;
}

export interface ModelGraph {
  nodes: ElementNode[];
  links: ElementLink[];
}