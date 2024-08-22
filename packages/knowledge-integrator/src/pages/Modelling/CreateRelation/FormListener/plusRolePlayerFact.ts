import { baseFact } from "../../baseFact";

export const plusRolePlayerFact = (props: any) => {
  const {
    facts,
    rolePlayerUID,
    rolePlayerName,
    roleUID,
    roleName,
    collection,
  } = props;

  const newFacts = [...facts];

  newFacts.push({
    ...baseFact,
    lh_object_uid: rolePlayerUID,
    lh_object_name: rolePlayerName,
    rel_type_uid: "4714",
    rel_type_name: "can have a role as a",
    rh_object_uid: roleUID,
    rh_object_name: roleName,
    collection_uid: collection.uid,
    collection_name: collection.name,
  });

  return newFacts;
};
