import { baseFact } from "../../baseFact";

export const plusRealizationFact = (props: any) => {
  const {
    facts,
    conceptualEntityUID,
    conceptualEntityName,
    realizedEntityUID,
    realizedEntityName,
    collection,
  } = props;

  const newFacts = [...facts];

  newFacts.push({
    ...baseFact,
    lh_object_uid: realizedEntityUID,
    lh_object_name: realizedEntityName,
    rel_type_uid: "5091",
    rel_type_name: "can be a realization of a",
    rh_object_uid: conceptualEntityUID,
    rh_object_name: conceptualEntityName,
    collection_uid: collection.uid,
    collection_name: collection.name,
  });

  return newFacts;
};
