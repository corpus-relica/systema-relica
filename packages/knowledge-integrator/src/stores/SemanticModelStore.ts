import {
  observable,
  action,
  computed,
  reaction,
  IReactionDisposer,
  makeAutoObservable,
} from "mobx";

import { Fact } from "../types";
import FactDataStore from "./FactDataStore";

class SemanticModelStore {
  private factDataStore: FactDataStore;
  private disposer: IReactionDisposer;

  models: Map<number, any> = new Map();

  constructor(factDataStore: FactDataStore) {
    makeAutoObservable(this);
    this.factDataStore = factDataStore;
  }

  addModels(models: any[]) {
    models.forEach((m) => {
      if (!this.models.has(m.uid)) {
        this.models.set(m.uid, m);
      }
    });
  }

  removeModels(modelUIDs: number[]) {
    modelUIDs.forEach((uid) => {
      this.models.delete(uid);
    });
  }

  removeModel(modelUID: number) {
    this.models.delete(modelUID);
  }

  clearModels() {
    this.models.clear();
  }
}

export default SemanticModelStore;
