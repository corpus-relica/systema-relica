import { baseFact } from "../../baseFact";

export const plusRequiredRoleFact = (props: any) => {
  const {
    facts,
    uid,
    preferredName,
    roleIndex,
    roleUID,
    roleName,
    collection,
  } = props;

  const foo = {
    1: { rel_type_uid: "4731", rel_type_name: "requires a role-1 as a" },
    2: { rel_type_uid: "4733", rel_type_name: "requires a role-2 as a" },
  };

  const newFacts = [...facts];

  newFacts.push({
    ...baseFact,
    lh_object_uid: uid.toString(),
    lh_object_name: preferredName,
    rel_type_uid: foo[roleIndex].rel_type_uid,
    rel_type_name: foo[roleIndex].rel_type_name,
    rh_object_uid: roleUID,
    rh_object_name: roleName,
    collection_uid: collection.uid,
    collection_name: collection.name,
  });

  return newFacts;
};
