import { baseFact } from "../baseFact";

export const plusDefinitiveFact = (props: any) => {
  const { facts, uid, preferredName, supertype, definition, collection } =
    props;

  const newFacts = [...facts];

  newFacts.push({
    ...baseFact,
    lh_object_uid: uid.toString(),
    lh_object_name: preferredName,
    rel_type_uid: "1146",
    rel_type_name: "is a specialization of",
    rh_object_uid: supertype.lh_object_uid.toString(),
    rh_object_name: supertype.lh_object_name,
    full_definition: "is a " + supertype.lh_object_name + " " + definition,
    partial_definition: definition,
    collection_uid: collection.uid,
    collection_name: collection.name,
  });

  return newFacts;
};
