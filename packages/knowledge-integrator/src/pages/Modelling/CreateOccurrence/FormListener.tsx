import React from "react";
import { useFormikContext } from "formik";

import { baseFact } from "../baseFact";

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    console.log(values);
    const {
      occurrenceSupertype,
      occurrenceName,
      occurrenceDefinition,
      involvements,
      collection,
    } = values;

    const facts = [];
    let definitiveFact = null;

    let definitiveUid = 1;
    let uid = definitiveUid;

    if (occurrenceSupertype && occurrenceName && occurrenceDefinition) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: occurrenceName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: occurrenceSupertype.lh_object_uid.toString(),
        rh_object_name: occurrenceSupertype.lh_object_name,
        full_definition: `is a ${occurrenceSupertype.rh_object_name} ${occurrenceDefinition}`,
        partial_definition: occurrenceDefinition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
      uid++;
    }

    if (involvements.length > 0) {
      involvements.forEach((involvement: any) => {
        const involvementUID = uid;
        if (
          involvement.supertype &&
          involvement.name &&
          involvement.definition
        ) {
          definitiveFact = facts.push({
            ...baseFact,
            lh_object_uid: uid.toString(),
            lh_object_name: involvement.name,
            rel_type_uid: "1146",
            rel_type_name: "is a specialization of",
            rh_object_uid: involvement.supertype.lh_object_uid.toString(),
            rh_object_name: involvement.supertype.lh_object_name,
            full_definition: involvement.definition,
            partial_definition: involvement.definition,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          uid++;
        }

        if (involvement.requiredRole1 && involvement.requiredRole2) {
          facts.push({
            ...baseFact,
            lh_object_uid: involvementUID.toString(),
            lh_object_name: involvement.name,
            rel_type_uid: "4731",
            rel_type_name: "requires a role-1 as a",
            rh_object_uid: involvement.requiredRole1.lh_object_uid.toString(),
            rh_object_name: involvement.requiredRole1.lh_object_name,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          facts.push({
            ...baseFact,
            lh_object_uid: involvementUID.toString(),
            lh_object_name: involvement.name,
            rel_type_uid: "4733",
            rel_type_name: "requires a role-2 as a",
            rh_object_uid: involvement.requiredRole2.lh_object_uid.toString(),
            rh_object_name: involvement.requiredRole2.lh_object_name,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          facts.push({
            ...baseFact,
            lh_object_uid: definitiveUid,
            lh_object_name: occurrenceName,
            rel_type_uid: "5343",
            rel_type_name: "can by definition have a role as a",
            rh_object_uid: involvement.requiredRole2.lh_object_uid.toString(),
            rh_object_name: involvement.requiredRole2.lh_object_name,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
        }
      });
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

export default FormListener;
