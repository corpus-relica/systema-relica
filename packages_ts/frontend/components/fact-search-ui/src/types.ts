export interface Var {
  uid: number;
  name: string;
  possibleValues: number[];
  isResolved: boolean;
}

export interface QueryResults {
  groundingFacts: any[]; // You might want to define a more specific type for groundFacts
  facts: any[]; // You might want to define a more specific type for facts
  vars: Var[];
}
