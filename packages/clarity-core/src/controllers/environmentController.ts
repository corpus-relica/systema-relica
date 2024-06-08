import * as es from "../services/environmentService.js";
import {
  getSpecializationHierarchy as gsh,
  getSubtypes as gst,
  getSubtypesCone as gstc,
  getFact,
  getFacts,
  retrieveAllFacts,
  getSpecializationFact,
  getDefinitiveFacts,
  getFactsRelatingEntities,
  textSearchExact,
  createKind,
  createIndividual,
  getClassified as gc,
  getClassificationFact,
} from "../services/relicaNeo4jService.js";
import { retrieveModels } from "./modelController.js";

import socketServer from "../utils/SocketServer.js";

import { Fact } from "../types.js";

const modelsFromFacts = async (facts: Fact[]) => {
  const entityUIDs = facts.reduce((acc: number[], fact: Fact) => {
    if (!acc.includes(fact.lh_object_uid)) acc.push(fact.lh_object_uid);
    if (!acc.includes(fact.rh_object_uid)) acc.push(fact.rh_object_uid);
    return acc;
  }, []);
  const models = (await retrieveModels(entityUIDs)).filter(
    (model: any) => model !== null,
  );
  return models;
};

export const retrieveEnvironment = async () => {
  const rawEnv = await es.retrieveEnvironment();
  const selectedEntity = await es.getSelectedEntity();

  return {
    facts: rawEnv.facts, //result,
    models: rawEnv.models, //models,
    selectedEntity: parseInt(selectedEntity),
  };
};

export const getSpecializationHierarchy = async (uid: number) => {
  const result = await gsh(uid);
  const facts = result.facts;
  const models = await modelsFromFacts(facts);

  es.insertFacts(facts);
  es.insertModels(models);

  const payload = { facts, models };
  socketServer.emit("system", "addFacts", payload);
  return payload;
};

export const getSpecializationFactByUID = async (uid: number) => {
  const result = await getSpecializationFact(uid);
  const models = await modelsFromFacts(result);

  es.insertFacts(result);
  es.insertModels(models);

  const payload = { facts: result, models };
  socketServer.emit("system", "addFacts", payload);
  return payload;
};

const loadEntityBase = async (uid: number) => {
  if (uid === undefined) return { facts: [], models: [] };

  const selectedEntity = await es.getSelectedEntity();
  const defResult = await getDefinitiveFacts(uid);
  const relResult = await getFactsRelatingEntities(uid, selectedEntity);

  console.log("loadEntity", selectedEntity, uid, defResult, relResult);
  console.log("loadEntity", typeof defResult, typeof relResult);
  const result = defResult.concat(relResult);
  const models = await modelsFromFacts(result);

  es.insertFacts(result);
  es.insertModels(models);

  const payload = { facts: result, models };
  return payload;
};

export const loadEntity = async (uid: number) => {
  const payload = await loadEntityBase(uid);
  socketServer.emit("system", "addFacts", payload);
  return payload;
};

export const loadEntities = async (uids: number[]) => {
  let facts: Fact[] = [];
  let models: any[] = [];
  for (let i = 0; i < uids.length; i++) {
    const payload = await loadEntityBase(uids[i]);
    facts = facts.concat(payload.facts);
    models = models.concat(payload.models);
  }
  const payload = { facts, models };
  socketServer.emit("system", "addFacts", payload);
  return payload;
};

export const removeEntity = async (uid: number) => {
  console.log("remove entity", uid);
  const env = await es.retrieveEnvironment();
  const facts = env.facts;
  let factsToRemove: Fact[] = [];
  let remainingFacts: Fact[] = [];
  facts.forEach((fact: Fact) => {
    if (fact.lh_object_uid === uid || fact.rh_object_uid === uid) {
      factsToRemove.push(fact);
    } else {
      remainingFacts.push(fact);
    }
  });
  let factUIDsToRemove: number[] = [];
  let candidateModelUIDsToRemove: Set<number> = new Set();
  factsToRemove.forEach((fact: Fact) => {
    factUIDsToRemove.push(fact.fact_uid);
    candidateModelUIDsToRemove.add(fact.lh_object_uid);
    candidateModelUIDsToRemove.add(fact.rh_object_uid);
  });
  remainingFacts.forEach((fact: Fact) => {
    if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
      candidateModelUIDsToRemove.delete(fact.lh_object_uid);
    }
    if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
      candidateModelUIDsToRemove.delete(fact.rh_object_uid);
    }
  });

  es.removeFacts(factUIDsToRemove);
  es.removeModels(Array.from(candidateModelUIDsToRemove));

  socketServer.emit("system", "remFacts", { fact_uids: factUIDsToRemove });
};

export const clearEntities = async () => {
  await es.clearEnvironment();
  socketServer.emit("system", "entitiesCleared", {});
};

export const removeEntities = async (uids: number[]) => {
  for (let i = 0; i < uids.length; i++) {
    removeEntity(uids[i]);
  }
};

export const removeEntityDescendants = async (uid: number) => {
  console.log(">// REMOVE ENTITY DESCENDANTS");
  const env = await es.retrieveEnvironment();
  const facts = env.facts;
  let factsToRemove: Fact[] = [];
  let remainingFacts: Fact[] = [];
  facts.forEach((fact: Fact) => {
    if (/* fact.lh_object_uid === uid || */ fact.rh_object_uid === uid) {
      factsToRemove.push(fact);
    } else {
      remainingFacts.push(fact);
    }
  });
  let factUIDsToRemove: number[] = [];
  let candidateModelUIDsToRemove: Set<number> = new Set();
  factsToRemove.forEach((fact: Fact) => {
    factUIDsToRemove.push(fact.fact_uid);
    candidateModelUIDsToRemove.add(fact.lh_object_uid);
    candidateModelUIDsToRemove.add(fact.rh_object_uid);
  });
  remainingFacts.forEach((fact: Fact) => {
    if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
      candidateModelUIDsToRemove.delete(fact.lh_object_uid);
    }
    if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
      candidateModelUIDsToRemove.delete(fact.rh_object_uid);
    }
  });

  es.removeFacts(factUIDsToRemove);
  es.removeModels(Array.from(candidateModelUIDsToRemove));

  socketServer.emit("system", "remFacts", { fact_uids: factUIDsToRemove });

  const subtypingFacts = factsToRemove.filter(
    (fact: Fact) => fact.rel_type_uid === 1146 && fact.rh_object_uid === uid,
  );
  console.log("SUBTYPING FACTS: ", subtypingFacts);
  subtypingFacts.forEach((fact: Fact) => {
    console.log(">>> RECURSE ON: ", fact.lh_object_uid);
    removeEntityDescendants(fact.lh_object_uid);
  });
};

export const getSubtypes = async (uid: number) => {
  const result = await gst(uid);
  const models = await modelsFromFacts(result);

  es.insertFacts(result);
  es.insertModels(models);

  const payload = { facts: result, models };
  socketServer.emit("system", "addFacts", payload);
  return payload;
};

export const getSubtypesCone = async (uid: number) => {
  const result = await gstc(uid);
  const models = await modelsFromFacts(result);

  es.insertFacts(result);
  es.insertModels(models);

  const payload = { facts: result, models };
  socketServer.emit("system", "addFacts", payload);
  return payload;
};

export const listSubtypes = async (uid: number) => {
  const result = await gst(uid);
  const models = await modelsFromFacts(result);

  const payload = { facts: result, models };
  return payload;
};

export const getAllRelatedFacts = async (uid: number) => {
  const result = await retrieveAllFacts(uid);
  const models = await modelsFromFacts(result);
  await es.insertFacts(result);
  await es.insertModels(models);
  socketServer.emit("system", "addFacts", { facts: result, models });
  return { facts: result, models };
};

// THIS PROBABLY DOESN"T BELONG HERE!!
// like, weigh the meritts of routing all such calls through CC vs. giving NOUS and Integrator direct access to the DB layer
export const textSearch = async (searchTerm: string) => {
  const selectedEntity = await es.getSelectedEntity();
  const searchResult: any = await textSearchExact(searchTerm);

  if (searchResult.facts.length === 0) return { facts: [], models: [] };

  const relResult = await getFactsRelatingEntities(
    searchResult.facts[0].lh_object_uid,
    selectedEntity,
  );
  const facts = searchResult.facts.concat(relResult);
  // console.log(Object.entries(result));
  // console.log(result.facts);
  const models = await modelsFromFacts(facts);

  es.insertFacts(facts);
  es.insertModels(models);

  socketServer.emit("system", "addFacts", { facts, models });

  return { facts: facts, models };
};

export const specializeKind = async (
  uid: number,
  supertypeName: string,
  name: string,
) => {
  const result = await createKind(uid, supertypeName, name, "this is a test");

  //refresh the category-descendants cache on client-side
  socketServer.emit("system", "updateCategoryDescendantsCache", {});

  if (result.success) {
    const { fact } = result;
    const facts = [fact];
    const models = await modelsFromFacts(facts);
    es.insertFacts(facts);
    es.insertModels(models);

    socketServer.emit("system", "addFacts", { facts, models });

    return { success: true, uid: fact.lh_object_uid };
  }

  return { error: "failed to specialize kind" };
  console.log("specialized Kind", result);
};

export const classifyIndividual = async (
  uid: number,
  typeName: string,
  name: string,
) => {
  const result = await createIndividual(uid, typeName, name, "this is a test");

  //refresh the category-descendants cache on client-side
  socketServer.emit("system", "updateCategoryDescendantsCache", {});

  if (result.success) {
    const { fact } = result;
    const facts = [fact];
    const models = await modelsFromFacts(facts);
    es.insertFacts(facts);
    es.insertModels(models);

    socketServer.emit("system", "addFacts", { facts, models });

    return { success: true, uid: fact.lh_object_uid };
  }

  return { error: "failed to classify individual" };
  console.log("classified Individual", result);
};

export const getClassified = async (uid: number) => {
  const result = await gc(uid);
  const facts = result;

  const models = await modelsFromFacts(facts);
  es.insertFacts(facts);
  es.insertModels(models);

  socketServer.emit("system", "addFacts", { facts, models });

  return { success: true, facts, models };
};

export const getClassificationFactByUID = async (uid: number) => {
  const result = await getClassificationFact(uid);
  const models = await modelsFromFacts(result);

  es.insertFacts(result);
  es.insertModels(models);

  const payload = { facts: result, models };
  socketServer.emit("system", "addFacts", payload);
  return payload;
};
