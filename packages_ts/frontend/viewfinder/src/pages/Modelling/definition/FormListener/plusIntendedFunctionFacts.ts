import { baseFact } from "../../baseFact";

export const plusIntendedFunctionFacts = (props: any) => {
  const { facts, uid, preferredName, func, collection } = props;

  const newFacts = [...facts];

  if (func && func.lh_object_uid && func.lh_object_name) {
    // codes.forEach((term: string) => {
    newFacts.push({
      ...baseFact,
      lh_object_uid: uid.toString(),
      lh_object_name: preferredName,
      rel_type_uid: "4717",
      rel_type_name: "has as an intended function a",
      rh_object_uid: func.lh_object_uid.toString(),
      rh_object_name: func.lh_object_name,
      collection_uid: collection.uid,
      collection_name: collection.name,
    });
    // });
  }

  return newFacts;
};
