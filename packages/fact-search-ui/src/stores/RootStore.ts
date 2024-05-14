import { makeAutoObservable } from "mobx";

export class RootStore {
  facts = [];
  totalCount = 0;
  filter: { uid: number; type: string } | undefined;
  initialQuery = "";
  constructor() {
    makeAutoObservable(this);
  }
}

const rootStore = new RootStore();
export default rootStore;
