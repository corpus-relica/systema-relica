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
    // console.log("Form values changed:", values);
    // Perform any desired action when form values change
    const {
      aspectSupertype,
      aspectName,
      aspectDefinition,
      qualifications,
      collection,
      possessors,
    } = values;

    console.log("/////////////////// FormListener //////////////////////");
    console.log(values);

    const facts = [];
    let definitiveFact = null;

    let definitiveUid = 1;
    let uid = definitiveUid;

    if (aspectSupertype && aspectName && aspectDefinition) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: aspectName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: aspectSupertype.lh_object_uid.toString(),
        rh_object_name: aspectSupertype.lh_object_name,
        full_definition:
          "is a " + aspectSupertype.lh_object_name + " " + aspectDefinition,
        partial_definition: aspectDefinition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
      uid++;

      if (qualifications && qualifications.length > 0) {
        qualifications.forEach((qual: any) => {
          if (!qual) return;
          facts.push({
            ...baseFact,
            lh_object_uid: uid.toString(),
            lh_object_name: qual.name,
            rel_type_uid: "1726",
            rel_type_name: "is a qualification of",
            rh_object_uid: definitiveUid,
            rh_object_name: aspectName,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });

          if (qual.value && !_.isEmpty(qual.uom)) {
            facts.push({
              ...baseFact,
              lh_object_uid: uid.toString(),
              lh_object_name: qual.name,
              rel_type_uid: "5737",
              rel_type_name: "is by definition quantified on scale as equal to",
              rh_object_uid: "???",
              rh_object_name: qual.value,
              collection_uid: collection.uid,
              collection_name: collection.name,
              uom_uid: qual.uom.lh_object_uid,
              uom_name: qual.uom.lh_object_name,
            });
          }
          uid++;
        });
      }

      if (!_.isEmpty(possessors)) {
        possessors.forEach((possessor: any) => {
          if (!_.isEmpty(possessor)) {
            facts.push({
              ...baseFact,
              lh_object_uid: possessor.lh_object_uid.toString(),
              lh_object_name: possessor.lh_object_name,
              rel_type_uid: "2069",
              rel_type_name: "can have as aspect a",
              rh_object_uid: definitiveUid,
              rh_object_name: aspectName,
              collection_uid: collection.uid,
              collection_name: collection.name,
            });
          }
        });
      }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

export default FormListener;
