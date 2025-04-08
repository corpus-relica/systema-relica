import { baseFact } from "../../baseFact";

export const plusAbbreviationFacts = (props: any) => {
  const { facts, uid, preferredName, abbreviations, collection } = props;

  const newFacts = [...facts];

  if (abbreviations.length > 0) {
    // const terms = synonymAbbrvCode.split(",");
    abbreviations.forEach((term: string) => {
      newFacts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: term,
        rel_type_uid: "1982",
        rel_type_name: "is an abbreviation of",
        rh_object_uid: uid.toString(),
        rh_object_name: preferredName,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
    });
  }

  return newFacts;
};
