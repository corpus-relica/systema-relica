import { baseFact } from "../../baseFact";

export const plusCompositionFacts = (props: any) => {
  const { facts, uid, preferredName, part, collection } = props;

  const newFacts = [...facts];

  if (part && part.lh_object_uid && part.lh_object_name) {
    // codes.forEach((term: string) => {
    facts.push({
      ...baseFact,
      lh_object_uid: uid.toString(),
      lh_object_name: preferredName,
      rel_type_uid: "5519",
      rel_type_name: "is by definition a possible part of a",
      rh_object_uid: part.lh_object_uid.toString(),
      rh_object_name: part.lh_object_name,
      collection_uid: collection.uid,
      collection_name: collection.name,
    });
    // });
  }

  return newFacts;
};
