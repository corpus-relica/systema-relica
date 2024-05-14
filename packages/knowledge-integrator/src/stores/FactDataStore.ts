import { makeAutoObservable } from "mobx";
import { Fact, Concept } from "../types";

class FactDataStore {
  facts: Array<Fact> = [];
  concepts: Map<number, Concept> = new Map();

  categories: Array<{ uid: number; name: string; descendants: Array<number> }> =
    [];

  constructor() {
    makeAutoObservable(this);
  }

  //

  addFact = (newFact: Fact) => {
    this.facts.push(newFact);
  };

  addFacts = (newFacts: Array<Fact>) => {
    this.facts = [...this.facts, ...newFacts];
  };

  // todo: probably move this
  findDefinitiveFacts = (termUID: number) => {
    return this.facts.filter(
      (fact) =>
        fact.lh_object_uid === termUID &&
        [1146, 1225, 1726].includes(fact.rel_type_uid),
    );
  };

  findAllRelatedFacts = (termUID: number) => {
    return this.facts.filter(
      (fact) =>
        fact.lh_object_uid === termUID || fact.rh_object_uid === termUID,
    );
  };

  findAllRelatedFactsFOAF = (termUID: number) => {
    const relatedFacts = this.facts.filter(
      (fact) =>
        fact.lh_object_uid === termUID || fact.rh_object_uid === termUID,
    );
    const relatedFactsFOAF = relatedFacts.reduce((acc, fact) => {
      const { lh_object_uid, rel_type_uid, rh_object_uid } = fact;
      const isLH = lh_object_uid === termUID;
      if (isLH) {
        return [...acc, ...this.findAllRelatedFacts(rh_object_uid)];
      } else {
        return [...acc, ...this.findAllRelatedFacts(lh_object_uid)];
      }
    }, []);
    // combine relatedFacts and relatedFactsFOAF
    const combinedFacts = [...relatedFacts, ...relatedFactsFOAF];
    const tempFactUIDs = new Set<number>();
    const uniqueFacts = combinedFacts.filter((fact) => {
      if (tempFactUIDs.has(fact.fact_uid)) {
        return false;
      } else {
        tempFactUIDs.add(fact.fact_uid);
        return true;
      }
    });
    return uniqueFacts;
  };

  removeFact = (factUID: number) => {
    console.log("removeFact", factUID);
    this.facts = this.facts.filter((fact) => fact.fact_uid !== factUID);
  };

  removeFacts = (factUIDs: number[]) => {
    console.log("removeFacts", factUIDs);
    console.log("this.facts before ", this.facts.length);
    factUIDs.forEach((factUID) => {
      this.removeFact(factUID);
    });

    console.log("this.facts after ", this.facts.length);
  };

  //

  clearFacts = () => {
    this.facts = [];
  };

  //

  addConcept = (newConcept: Concept) => {
    this.concepts.set(newConcept.uid, newConcept);
  };

  addConcepts = (newConcepts: Array<Concept>) => {
    console.log("addConcepts", newConcepts);
    newConcepts.forEach((concept) => {
      this.concepts.set(concept.uid, concept);
    });
  };

  removeConcept = (conceptUID: number) => {
    this.concepts.delete(conceptUID);
  };

  //

  setCategories = (
    newCategories: Array<{
      uid: number;
      name: string;
      descendants: Array<number>;
    }>,
  ) => {
    this.categories = newCategories;
  };

  //

  getRelTypeName = (rel_type_uid: number) => {
    return this.facts.find((fact) => fact.rel_type_uid === rel_type_uid)
      ?.rel_type_name;
  };

  hasObject = (objectUID: number) => {
    return this.facts.some(
      (fact) =>
        fact.lh_object_uid === objectUID || fact.rh_object_uid === objectUID,
    );
  };
}

export default FactDataStore;
