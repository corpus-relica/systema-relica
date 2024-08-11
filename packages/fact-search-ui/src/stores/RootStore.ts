import { makeAutoObservable } from "mobx";

export class RootStore {
  facts = [];
  totalCount = 0;
  filter: { uid: number; type: string } | undefined;
  initialQuery = "";
  queryResult = { facts: [], vars: [] };
  mode: "search" | "query" = "search";
  constructor() {
    makeAutoObservable(this);
  }
}

const rootStore = new RootStore();
export default rootStore;
