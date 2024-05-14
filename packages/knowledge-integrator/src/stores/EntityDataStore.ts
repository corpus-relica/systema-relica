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
import Entity from "./Entity";

class EntityDataStore {
  private factDataStore: FactDataStore;
  private disposer: IReactionDisposer;

  entities: Map<number, Entity> = new Map();

  constructor(factDataStore: FactDataStore) {
    makeAutoObservable(this);
    this.factDataStore = factDataStore;
    // this.disposer = reaction(
    //   () => this.factDataStore.facts,
    //   (facts) => {
    //     this.updateEntities(facts);
    //   }
    // );
  }

  async updateEntities(facts: Array<Fact>) {
    console.log("UPDATEENTITIES", facts.length);
    // const entities = this.entities;

    // // Remove entities
    // const entityIds = new Set<number>();
    // facts.forEach((fact) => {
    //   const { lh_object_uid, rh_object_uid } = fact;
    //   entityIds.add(lh_object_uid);
    //   entityIds.add(rh_object_uid);
    // });
    // const entityIdsToDelete = Array.from(entities.keys()).filter(
    //   (id) => !entityIds.has(id)
    // );
    // entityIdsToDelete.forEach((id) => entities.delete(id));

    // // Add entities
    // facts.forEach((fact) => {
    //   const { lh_object_uid, rh_object_uid } = fact;
    //   if (!entities.has(lh_object_uid)) {
    //     entities.set(lh_object_uid, new Entity(lh_object_uid));
    //   }
    //   if (!entities.has(rh_object_uid)) {
    //     entities.set(rh_object_uid, new Entity(rh_object_uid));
    //   }
    // });

    // // update entities
    // facts.forEach((fact) => {
    //   const { lh_object_uid, rh_object_uid, lh_object_name, rh_object_name } =
    //     fact;
    //   const entity_a: Entity = entities.get(lh_object_uid);
    //   const entity_b: Entity = entities.get(rh_object_uid);
    //   if (entity_a) {
    //     entity_a.addFact(fact);
    //   }
    //   if (entity_b) {
    //     entity_b.addFact(fact);
    //   }
    //   switch (fact.rel_type_uid) {
    //     case 1146: //is a specialization of
    //       entity_a.setName(lh_object_name);
    //       entity_a.full_definition = fact.full_definition;
    //       entity_a.addSupertype(entity_b);
    //       entity_b.addSubtype(entity_a);
    //       break;
    //     case 1225: //is classified as a
    //       entity_a.setName(lh_object_name);
    //       entity_a.addClassifier(entity_b);
    //       entity_b.addClassified(entity_a);
    //       break;
    //     case 1981: // is a synonym of
    //       entity_b.addSynonymTerm(lh_object_name);
    //       break;
    //     case 1986: // is an inverse of
    //       entity_b.addInverseTerm(lh_object_name);
    //       break;
    //     default:
    //       console.log(
    //         "UNKNOWN REL TYPE",
    //         fact.rel_type_uid,
    //         fact.rel_type_name
    //       );
    //       break;
    //   }
    // });
  }
}

export default EntityDataStore;
