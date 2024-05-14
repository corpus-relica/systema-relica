import {
  observable,
  action,
  computed,
  reaction,
  IReactionDisposer,
  makeObservable,
} from "mobx";

import { Fact } from "../types";

class Entity {
  private localFacts: Map<number, Fact> = new Map();
  uid: number;
  supertypes: Map<number, Entity> = new Map();
  subtypes: Map<number, Entity> = new Map();
  classifiers: Map<number, Entity> = new Map();
  classified: Map<number, Entity> = new Map();
  synonyms: Array<string> = [];
  inverses: Array<string> = [];
  name: string = "";
  full_definition: string = "";

  constructor(uid: number) {
    this.uid = uid;

    makeObservable(this, {
      uid: observable,
      supertypes: observable,
      subtypes: observable,
      classifiers: observable,
      classified: observable,
      synonyms: observable,
      inverses: observable,
      name: observable,
      full_definition: observable,

      setName: action,
      addSupertype: action,
      addSubtype: action,
      addClassifier: action,
      addClassified: action,
      addSynonymTerm: action,
      addInverseTerm: action,
    });
  }

  addFact(fact: Fact) {
    if (!this.localFacts.has(fact.fact_uid)) {
      this.localFacts.set(fact.fact_uid, fact);
    }
  }

  setName(n: string) {
    this.name = n;
  }

  addSupertype(e: Entity) {
    if (!this.supertypes.has(e.uid)) {
      this.supertypes.set(e.uid, e);
    }
  }

  addSubtype(e: Entity) {
    if (!this.subtypes.has(e.uid)) {
      this.subtypes.set(e.uid, e);
    }
  }

  addClassifier(e: Entity) {
    if (!this.classifiers.has(e.uid)) {
      this.classifiers.set(e.uid, e);
    }
  }

  addClassified(e: Entity) {
    if (!this.classified.has(e.uid)) {
      this.classified.set(e.uid, e);
    }
  }

  addSynonymTerm = (synonym: string) => {
    if (!this.synonyms.includes(synonym)) {
      this.synonyms.push(synonym);
    }
  };

  addInverseTerm = (inverse: string) => {
    if (!this.inverses.includes(inverse)) {
      this.inverses.push(inverse);
    }
  };
}

export default Entity;
