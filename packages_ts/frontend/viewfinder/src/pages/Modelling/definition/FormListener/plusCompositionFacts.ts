import { baseFact } from "../../baseFact";

export const plusCompositionFacts = (props: any) => {
  const { facts, uid, preferredName, part, collection } = props;

  const newFacts = [...facts];

  if (part && part.lh_object_uid && part.lh_object_name) {
    // codes.forEach((term: string) => {
    newFacts.push({
      ...baseFact,
      lh_object_uid: part.lh_object_uid.toString(),
      lh_object_name: part.lh_object_name,
      rel_type_uid: "5519",
      rel_type_name: "is by definition a possible part of a",
      rh_object_uid: uid.toString(),
      rh_object_name: preferredName,
      collection_uid: collection.uid,
      collection_name: collection.name,
    });
    // });
  }

  return newFacts;
};
