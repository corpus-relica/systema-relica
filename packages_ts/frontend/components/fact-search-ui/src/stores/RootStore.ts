import { makeAutoObservable } from "mobx";
import { QueryResults } from "../types.js";

export class RootStore {
  facts = [];
  totalCount = 0;
  filter: { uid: number; type: string } | undefined;
  initialQuery = "";
  queryResult: QueryResults | null = {
    facts: [],
    vars: [],
    groundingFacts: [],
  };
  mode: "search" | "query" = "search";
  constructor() {
    makeAutoObservable(this);
  }
  token?: string;
}

const rootStore = new RootStore();
export default rootStore;
