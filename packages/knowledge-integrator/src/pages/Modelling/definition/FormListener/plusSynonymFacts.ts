import { baseFact } from "../../baseFact";

export const plusSynonymFacts = (props: any) => {
  const { facts, uid, preferredName, synonyms, collection } = props;

  const newFacts = [...facts];

  if (synonyms.length > 0) {
    // const terms = synonymAbbrvCode.split(",");
    synonyms.forEach((term: string) => {
      newFacts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: term,
        rel_type_uid: "1981",
        rel_type_name: "is a synonym of",
        rh_object_uid: uid.toString(),
        rh_object_name: preferredName,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
    });
  }

  return newFacts;
};
