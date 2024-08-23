import React from "react";
import * as _ from "lodash";
import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";
import { baseFact } from "../baseFact";

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    const {
      roleSupertype,
      roleName,
      roleDefinition,
      definitiveRolePlayers,
      possibleRolePlayers,
      requiringRelations,
      collection,
    } = values;

    console.log("MUTHERFUCKING ROLE Form values changed:", values);

    const facts = [];
    let definitiveFact = null;

    let definitiveUid = 1;
    let uid = definitiveUid;

    if (roleSupertype && roleName && roleDefinition) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: roleName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: roleSupertype.lh_object_uid.toString(),
        rh_object_name: roleSupertype.lh_object_name,
        full_definition: roleDefinition,
        partial_definition: roleDefinition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
      uid++;

      /////////////////////////////
      // DEFINITIVE ROLE PLAYERS //
      /////////////////////////////

      if (definitiveRolePlayers && definitiveRolePlayers.length > 0) {
        definitiveRolePlayers.forEach((player: any) => {
          if (!player) return;
          facts.push({
            ...baseFact,
            lh_object_uid: player.lh_object_uid,
            lh_object_name: player.lh_object_name,
            rel_type_uid: "5343",
            rel_type_name: "can by definition have a role as a",
            rh_object_uid: definitiveUid,
            rh_object_name: roleName,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          uid++;
        });
      }

      ///////////////////////////
      // POSSIBLE ROLE PLAYERS //
      ///////////////////////////

      if (possibleRolePlayers && possibleRolePlayers.length > 0) {
        possibleRolePlayers.forEach((player: any) => {
          if (!player) return;
          facts.push({
            ...baseFact,
            lh_object_uid: player.lh_object_uid,
            lh_object_name: player.lh_object_name,
            rel_type_uid: "4714",
            rel_type_name: "can have a role as a",
            rh_object_uid: definitiveUid,
            rh_object_name: roleName,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          uid++;
        });
      }

      /////////////////////////
      // REQUIRING RELATIONS //
      /////////////////////////

      // rel_type_uid: "5343",
      // rel_type_name: "can by definition have a role as a",

      if (requiringRelations && requiringRelations.length > 0) {
        requiringRelations.forEach((relation: any) => {
          if (_.isEmpty(relation)) return;
          facts.push({
            ...baseFact,
            lh_object_uid: relation.fact.lh_object_uid,
            lh_object_name: relation.fact.lh_object_name,
            rel_type_uid: relation.roleIndex === 1 ? "4731" : "4733",
            rel_type_name:
              relation.roleIndex === 1
                ? "requires a role-1 as a"
                : "requires a role-2 as a",
            rh_object_uid: definitiveUid,
            rh_object_name: roleName,
          });
          uid++;
        });
      }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

export default FormListener;
