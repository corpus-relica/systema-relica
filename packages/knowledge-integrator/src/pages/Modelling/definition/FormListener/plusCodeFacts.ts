import { baseFact } from "../../baseFact";

export const plusCodeFacts = (props: any) => {
  const { facts, uid, preferredName, codes, collection } = props;

  const newFacts = [...facts];

  if (codes.length > 0) {
    codes.forEach((term: string) => {
      newFacts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: term,
        rel_type_uid: "1983",
        rel_type_name: "is a code for",
        rh_object_uid: uid.toString(),
        rh_object_name: preferredName,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
    });
  }

  return newFacts;
};
