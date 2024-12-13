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
import { baseFact } from "../../baseFact";

import { plusDefinitiveFact } from "../../FormListener/plusDefinitiveFact";

import { plusRequiredRoleFact } from "./plusRequiredRoleFact";
import { plusRolePlayerFact } from "./plusRolePlayerFact";
import { plusRealizationFact } from "./plusRealizationFact";

import { Fact } from "../../../../types";

const isEmptyObj = (obj: any) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    const {
      realizedRelationSupertype,
      realizedRelationName,
      realizedRelationDefinition,

      realizedRequiredRole1,
      realizedRequiredRole1Definition,
      realizedRequiredRole1Name,
      realizedRequiredRole1Supertype,
      realizedRequiredRole1RolePlayer,

      realizedRequiredRole2,
      realizedRequiredRole2Definition,
      realizedRequiredRole2Name,
      realizedRequiredRole2Supertype,
      realizedRequiredRole2RolePlayer,

      conceptualRelationSupertype,
      conceptualRelationName,
      conceptualRelationDefinition,

      conceptualRequiredRole1,
      conceptualRequiredRole1Definition,
      conceptualRequiredRole1Name,
      conceptualRequiredRole1Supertype,
      conceptualRequiredRole1RolePlayer,

      conceptualRequiredRole2,
      conceptualRequiredRole2Definition,
      conceptualRequiredRole2Name,
      conceptualRequiredRole2Supertype,
      conceptualRequiredRole2RolePlayer,

      collection,
      //
    } = values;

    let facts: Fact[] = [];

    let definitiveUid = 1;
    let uid = definitiveUid;

    ///////////////////////
    // REALIZED RELATION //
    ///////////////////////

    if (
      realizedRelationSupertype &&
      realizedRelationName &&
      realizedRelationDefinition
    ) {
      facts = plusDefinitiveFact({
        facts,
        uid,
        preferredName: realizedRelationName,
        supertype: realizedRelationSupertype,
        definition: realizedRelationDefinition,
        collection,
      });
      uid++;

      // required role 1
      //
      if (!_.isEmpty(realizedRequiredRole1)) {
        // relating an existing entity
        facts = plusRequiredRoleFact({
          facts,
          uid: definitiveUid,
          preferredName: realizedRelationName,
          roleIndex: 1,
          roleUID: realizedRequiredRole1.lh_object_uid.toString(),
          roleName: realizedRequiredRole1.lh_object_name,
          collection,
        });
      } else if (
        realizedRequiredRole1Name &&
        realizedRequiredRole1Supertype &&
        realizedRequiredRole1Definition
      ) {
        // relating a new entity
        facts = plusDefinitiveFact({
          facts,
          uid: uid,
          preferredName: realizedRequiredRole1Name,
          supertype: realizedRequiredRole1Supertype,
          definition: realizedRequiredRole1Definition,
          collection,
        });

        facts = plusRequiredRoleFact({
          facts,
          uid: definitiveUid,
          preferredName: realizedRelationName,
          roleIndex: 1,
          roleUID: uid.toString(),
          roleName: realizedRequiredRole1Name,
          collection,
        });

        if (!_.isEmpty(realizedRequiredRole1RolePlayer)) {
          facts = plusRolePlayerFact({
            facts,
            rolePlayerUID:
              realizedRequiredRole1RolePlayer.lh_object_uid.toString(),
            rolePlayerName: realizedRequiredRole1RolePlayer.lh_object_name,
            roleUID: uid.toString(),
            roleName: realizedRequiredRole1Name,
            collection,
          });
        }
      }

      // required role 2
      //
      if (!_.isEmpty(realizedRequiredRole2)) {
        // relating an existing entity
        facts = plusRequiredRoleFact({
          facts,
          uid: definitiveUid,
          preferredName: realizedRelationName,
          roleIndex: 2,
          roleUID: realizedRequiredRole2.lh_object_uid.toString(),
          roleName: realizedRequiredRole2.lh_object_name,
          collection,
        });
      } else if (
        realizedRequiredRole2Name &&
        realizedRequiredRole2Supertype &&
        realizedRequiredRole2Definition
      ) {
        // relating a new entity
        facts = plusDefinitiveFact({
          facts,
          uid: uid,
          preferredName: realizedRequiredRole2Name,
          supertype: realizedRequiredRole2Supertype,
          definition: realizedRequiredRole2Definition,
          collection,
        });

        facts = plusRequiredRoleFact({
          facts,
          uid: definitiveUid,
          preferredName: realizedRelationName,
          roleIndex: 2,
          roleUID: uid.toString(),
          roleName: realizedRequiredRole2Name,
          collection,
        });

        if (!_.isEmpty(realizedRequiredRole2RolePlayer)) {
          facts = plusRolePlayerFact({
            facts,
            rolePlayerUID:
              realizedRequiredRole2RolePlayer.lh_object_uid.toString(),
            rolePlayerName: realizedRequiredRole2RolePlayer.lh_object_name,
            roleUID: uid.toString(),
            roleName: realizedRequiredRole2Name,
            collection,
          });
        }
      }
    }

    /////////////////////////
    // CONCEPTUAL RELATION //
    /////////////////////////

    if (
      conceptualRelationSupertype &&
      conceptualRelationName &&
      conceptualRelationDefinition
    ) {
      facts = plusDefinitiveFact({
        facts,
        uid,
        preferredName: conceptualRelationName,
        supertype: conceptualRelationSupertype,
        definition: conceptualRelationDefinition,
        collection,
      });

      // beware: The following is a little tricky with the uid
      if (
        realizedRelationSupertype &&
        realizedRelationName &&
        realizedRelationDefinition
      ) {
        facts = plusRealizationFact({
          facts,
          conceptualEntityUID: uid.toString(),
          conceptualEntityName: conceptualRelationName,
          realizedEntityUID: definitiveUid.toString(),
          realizedEntityName: realizedRelationName,
          collection,
        });
      }
      definitiveUid = uid;
      uid++;

      // required role 1
      //
      if (!_.isEmpty(conceptualRequiredRole1)) {
        // relating an existing entity
        facts = plusRequiredRoleFact({
          facts,
          uid: definitiveUid,
          preferredName: conceptualRelationName,
          roleIndex: 1,
          roleUID: conceptualRequiredRole1.lh_object_uid.toString(),
          roleName: conceptualRequiredRole1.lh_object_name,
          collection,
        });
      } else if (
        conceptualRequiredRole1Name &&
        conceptualRequiredRole1Supertype &&
        conceptualRequiredRole1Definition
      ) {
        // relating a new entity
        facts = plusDefinitiveFact({
          facts,
          uid: uid,
          preferredName: conceptualRequiredRole1Name,
          supertype: conceptualRequiredRole1Supertype,
          definition: conceptualRequiredRole1Definition,
          collection,
        });

        facts = plusRequiredRoleFact({
          facts,
          uid: definitiveUid,
          preferredName: conceptualRelationName,
          roleIndex: 1,
          roleUID: uid.toString(),
          roleName: conceptualRequiredRole1Name,
          collection,
        });

        if (!_.isEmpty(conceptualRequiredRole1RolePlayer)) {
          facts = plusRolePlayerFact({
            facts,
            rolePlayerUID:
              conceptualRequiredRole1RolePlayer.lh_object_uid.toString(),
            rolePlayerName: conceptualRequiredRole1RolePlayer.lh_object_name,
            roleUID: uid.toString(),
            roleName: conceptualRequiredRole1Name,
            collection,
          });
        }
      }

      // required role 2
      //
      if (!_.isEmpty(conceptualRequiredRole2)) {
        // relating an existing entity
        facts = plusRequiredRoleFact({
          facts,
          uid: definitiveUid,
          preferredName: conceptualRelationName,
          roleIndex: 2,
          roleUID: conceptualRequiredRole2.lh_object_uid.toString(),
          roleName: conceptualRequiredRole2.lh_object_name,
          collection,
        });
      } else if (
        conceptualRequiredRole2Name &&
        conceptualRequiredRole2Supertype &&
        conceptualRequiredRole2Definition
      ) {
        // relating a new entity
        facts = plusDefinitiveFact({
          facts,
          uid: uid,
          preferredName: conceptualRequiredRole2Name,
          supertype: conceptualRequiredRole2Supertype,
          definition: conceptualRequiredRole2Definition,
          collection,
        });

        facts = plusRequiredRoleFact({
          facts,
          uid: definitiveUid,
          preferredName: conceptualRelationName,
          roleIndex: 2,
          roleUID: uid.toString(),
          roleName: conceptualRequiredRole2Name,
          collection,
        });

        if (!_.isEmpty(conceptualRequiredRole2RolePlayer)) {
          facts = plusRolePlayerFact({
            facts,
            rolePlayerUID:
              conceptualRequiredRole2RolePlayer.lh_object_uid.toString(),
            rolePlayerName: conceptualRequiredRole2RolePlayer.lh_object_name,
            roleUID: uid.toString(),
            roleName: conceptualRequiredRole2Name,
            collection,
          });
        }
      }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

export default FormListener;
