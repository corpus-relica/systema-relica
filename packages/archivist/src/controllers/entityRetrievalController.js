import { execQuery } from "../services/queryService.js";
import { collections } from "../services/queries.js";
import cache from "../utils/cache.js";

export const getCollections = async () => {
  const result = await execQuery(collections);

  return result[0]
    .get("collections")
    .map(({ name, uid }) => ({ name, uid: uid?.toNumber() }));
};

export const getEntityType = async (uid) => {
  if (uid === undefined) return undefined;
  if (uid === 730000) return "anything";

  const q = `MATCH ()--(r)-->() WHERE r.lh_object_uid = $uid AND (r.rel_type_uid = 1146 OR r.rel_type_uid = 1726 OR r.rel_type_uid = 1225) RETURN r`;
  const result = await execQuery(q, { uid: +uid });

  if (result[0] === undefined) {
    console.error("No entity type found for uid", uid);
    return undefined;
  }

  const { rel_type_uid } = result[0].toObject().r.properties;

  if (!rel_type_uid) {
    console.error("No rel_type_uid found for uid", uid);
    console.log(result[0].toObject().r.properties);
    return undefined;
  }

  //TODO: figure out what situation this 'toInt()' call is meant to handl3e
  if (
    rel_type_uid === 1146 ||
    (rel_type_uid.toInt && rel_type_uid.toInt() === 1146)
  )
    return "kind";
  if (
    rel_type_uid === 1726 ||
    (rel_type_uid.toInt && rel_type_uid.toInt() === 1726)
  )
    return "qualification"; //which is a subtype of kind
  if (
    rel_type_uid === 1225 ||
    (rel_type_uid.toInt && rel_type_uid.toInt() === 1225)
  )
    return "individual";
};

export const getPrompt = async (uid) => {
  return cache.promptOf(uid);
};

export const setPrompt = async (uid, prompt) => {
  return cache.setPromptOf(uid, prompt);
};

export const getMinFreeEntityUID = async () => {
  return cache.minFreeEntityUID();
};

export const setMinFreeEntityUID = async (uid) => {
  return cache.setMinFreeEntityUID(uid);
};

export const getMinFreeFactUID = async () => {
  return cache.minFreeFactUID();
};

export const setMinFreeFactUID = async (uid) => {
  return cache.setMinFreeFactUID(uid);
};
