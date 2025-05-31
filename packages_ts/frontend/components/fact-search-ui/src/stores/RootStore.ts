import { makeAutoObservable } from "mobx";
import { QueryResults } from "../types";

export class RootStore {
  facts = [];
  totalCount = 0;
  filter: { uid: number; type: string } | undefined;
  initialQuery = "";
  queryResult: QueryResults | null = {
    facts: [],
    vars: [],
    groundingFacts: [],
    totalCount: 0,
  };
  mode: "search" | "query" = "search";
  constructor() {
    makeAutoObservable(this);
  }
  token?: string;
}

const rootStore = new RootStore();
export default rootStore;
