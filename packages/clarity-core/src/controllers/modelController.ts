import {
  getCategory,
  retrieveAllFacts,
  getDefinitiveFacts,
  getRelatedOnUIDSubtypeCone,
  getEntityType,
  submitDefinition,
  submitCollection,
} from "../services/relicaNeo4jService.js";
import { Fact } from "../types.js";

const physObjUID = 730044;
const aspectUID = 790229;
const roleUID = 160170;
const relationUID = 2850;
const occurrenceUID = 193671;

const PHYSICAL_OBJECT = "physical object";
const ASPECT = "aspect";
const ROLE = "role";
const RELATION = "relation";
const OCCURRENCE = "occurrence";

const getPhysicalObjectModel = async (uid: number) => {
  return { aspects: [], roles: [], components: [], connections: [] };
};
const getAspectModel = async (uid: number) => {
  return { possessors: [] };
};
const getRoleModel = async (uid: number) => {
  return { rolePlayers: [] };
};
const getRelationModel = async (uid: number) => {
  return { rolePlayer1: null, rolePlayer2: null };
};
const getOccurrenceModel = async (uid: number) => {
  return { aspects: [], involved: [] };
};

export const retrieveKindModel = async (uid: number) => {
  console.log("retrieveKindModel", uid);
  const category = await getCategory(uid);
  console.log("category", category);
  const facts = await retrieveAllFacts(uid);
  console.log("facts", facts);
  const definitiveFacts = await getDefinitiveFacts(uid);
  console.log("definitiveFacts", definitiveFacts);

  const specialization = await getRelatedOnUIDSubtypeCone(uid, 1146);
  console.log("specialization", specialization);
  const classification = await getRelatedOnUIDSubtypeCone(uid, 1225);
  console.log("classification", classification);
  const synonyms = await getRelatedOnUIDSubtypeCone(uid, 1981);
  console.log("synonyms", synonyms);
  const inverses = await getRelatedOnUIDSubtypeCone(uid, 1986);
  console.log("inverses", inverses);
  const reqRole1 = await getRelatedOnUIDSubtypeCone(uid, 4731);
  console.log("reqRole1", reqRole1);
  const reqRole2 = await getRelatedOnUIDSubtypeCone(uid, 4733);
  console.log("reqRole2", reqRole2);
  const possRoles = await getRelatedOnUIDSubtypeCone(uid, 4714);
  console.log("possRoles", possRoles);

  let model;
  switch (category) {
    case PHYSICAL_OBJECT:
      model = await getPhysicalObjectModel(uid);
      break;
    case ASPECT:
      model = await getAspectModel(uid);
      break;
    case ROLE:
      model = await getRoleModel(uid);
      break;
    case RELATION:
      model = await getRelationModel(uid);
      break;
    case OCCURRENCE:
      model = await getOccurrenceModel(uid);
      break;
    default:
      model = {};
      break;
  }
  console.log(definitiveFacts);

  return Object.assign(model, {
    uid: uid,

    collection: {
      uid: definitiveFacts[0].collection_uid,
      name: definitiveFacts[0].collection_name,
    },
    name: definitiveFacts[0].lh_object_name, //.map((x: Fact) => x.lh_object_name).join(", "),
    type: "kind",
    category: category,
    definition: definitiveFacts.map((x: Fact) => ({
      fact_uid: x.fact_uid,
      partial_definition: x.partial_definition,
      full_definition: x.full_definition,
    })),
    facts: facts,
    //
    1146: specialization.map((x: Fact) => x.rh_object_uid),
    1225: classification.map((x: Fact) => x.rh_object_uid),
    1981: synonyms.map((x: Fact) => x.lh_object_name),
    1986: inverses.map((x: Fact) => x.lh_object_name),
    4731: reqRole1.map((x: Fact) => x.rh_object_uid),
    4733: reqRole2.map((x: Fact) => x.rh_object_uid),
    4714: possRoles.map((x: Fact) => x.rh_object_uid),
  });
};

export const retrieveIndividualModel = async (uid: number) => {
  const category = await getCategory(uid);

  // const category = await getCategory(uid);
  const facts = await retrieveAllFacts(uid);
  const definitiveFacts = await getDefinitiveFacts(uid);

  const classification = await getRelatedOnUIDSubtypeCone(uid, 1225);
  // const synonyms = await getRelatedOnUIDSubtypeCone(uid, 1981);
  // const inverses = await getRelatedOnUIDSubtypeCone(uid, 1986);
  // const reqRole1 = await getRelatedOnUIDSubtypeCone(uid, 4731);
  // const reqRole2 = await getRelatedOnUIDSubtypeCone(uid, 4733);
  // const possRoles = await getRelatedOnUIDSubtypeCone(uid, 4714);
  console.log(facts.length, definitiveFacts, classification.length);

  if (classification.length === 0) {
    return null;
  }

  const baseObj = {
    uid: uid,
    name: classification[0].lh_object_name,
    collection: {
      uid: definitiveFacts[0].collection_uid,
      name: definitiveFacts[0].collection_name,
    },
    1225: classification.map((x: Fact) => x.rh_object_uid),
    type: "individual",
    category: category,
    definition: definitiveFacts.map((x: Fact) => ({
      fact_uid: x.fact_uid,
      partial_definition: x.partial_definition,
      full_definition: x.full_definition,
    })),
    facts,
  };
  const value = await getRelatedOnUIDSubtypeCone(uid, 5025); // 'has on scale a value equal to'
  if (value.length > 0) {
    const valFact = value[0];
    const val = parseInt(valFact.rh_object_name);
    const uom = { uid: valFact.uom_uid, name: valFact.uom_name };
    return { ...baseObj, value: { quant: val, uom } };
  }

  return baseObj;
};

export const retrieveQualificationModel = async (uid: number) => {
  const category = await getCategory(uid);
  const facts = await retrieveAllFacts(uid);
  const definitiveFacts = await getDefinitiveFacts(uid);

  const baseObj = {
    name: definitiveFacts[0].lh_object_name,
    uid: uid,
    type: "qualification",
    category: category,
    facts,
  };
  return baseObj;
};

export const retrieveModel = async (uid: number) => {
  const type: string = await getEntityType(uid);

  if (type === "kind") {
    return retrieveKindModel(uid);
  } else if (type === "individual") {
    return retrieveIndividualModel(uid);
  } else if (type === "qualification") {
    return retrieveQualificationModel(uid);
  } else if (uid === 730000) {
    return {
      uid: uid,
      name: "anything",
      type: "kind",
      category: "anything",
      definition: "is an anything",
      facts: [],
      1146: [],
      1225: [],
      1981: [],
      1986: [],
      4731: [],
      4733: [],
      4714: [],
    };
  } else {
    console.log(
      "//// ERROR: modelController.retrieveModel: unknown type uid",
      uid,
    );
    return null;
  }
};

async function retrieveModelsSequentially(uids: number[]) {
  const models = [];
  for (const uid of uids) {
    const model = await retrieveModel(uid);
    models.push(model);
  }
  return models;
}

async function throttlePromises<T>(
  funcs: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  let results: Promise<T>[] = [];
  let executing: Promise<void>[] = [];

  for (const func of funcs) {
    const p = Promise.resolve().then(func);
    results.push(p);

    if (limit <= funcs.length) {
      const e: any = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

export const retrieveModels = async (uids: Array<number>) => {
  const funcs = uids.map((uid) => () => retrieveModel(uid));
  return await throttlePromises(funcs, 5);
  // return await retrieveModelsSequentially(uids);
};

export const updateDefinition = async (
  fact_uid: number,
  partial_definition: string,
  full_definition: string,
) => {
  const response = await submitDefinition(
    fact_uid,
    partial_definition,
    full_definition,
  );
  // TODO: righit about here we have the opportuninty to update the local store
  //
  return response;
};

export const updateCollection = async (
  fact_uid: number,
  collection_uid: number,
  collection_name: string,
) => {
  const response = await submitCollection(
    fact_uid,
    collection_uid,
    collection_name,
  );
  return response;
};
