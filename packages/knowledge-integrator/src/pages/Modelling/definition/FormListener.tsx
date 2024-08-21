import React from "react";
import { baseFact } from "../baseFact";
import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    // console.log("Form values changed:", values);
    // Perform any desired action when form values change
    const {
      uid,
      languageUid,
      language,
      languageCommunityUid,
      languageCommunity,
      preferredName,
      synonyms,
      abbreviations,
      codes,
      supertype,
      aspects,
      aspect,
      aspectValue,
      func,
      definition,
      aspectValueUom,
      part,
      aspectQualifications,
      collection,
    } = values;

    const facts = [];
    let definitiveFact = null;

    if (
      uid &&
      languageUid &&
      language &&
      languageCommunityUid &&
      languageCommunity &&
      preferredName &&
      supertype &&
      definition
    ) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: preferredName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: supertype.lh_object_uid.toString(),
        rh_object_name: supertype.lh_object_name,
        full_definition: "is a " + supertype.lh_object_name + " " + definition,
        partial_definition: definition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });

      // Synonyms
      //
      if (synonyms.length > 0) {
        // const terms = synonymAbbrvCode.split(",");
        synonyms.forEach((term: string) => {
          facts.push({
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

      // Abbreviations
      //
      if (abbreviations.length > 0) {
        // const terms = synonymAbbrvCode.split(",");
        abbreviations.forEach((term: string) => {
          facts.push({
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

      // Codes
      //
      if (codes.length > 0) {
        codes.forEach((term: string) => {
          facts.push({
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

      // Aspects
      //
      if (Array.isArray(aspects) && aspects.length > 0) {
        console.log("Mutherfucking aspect", aspects);
        aspects.forEach((aspect: any) => {
          // !!! inelegant; elswhere the value of aspect is being set to an empty string
          // when the actual field is blank, what we need to do is just not push anything into
          // the array at all in that case, avoid all these checks at the end of the journey
          if (aspect) {
            facts.push({
              ...baseFact,
              lh_object_uid: supertype.lh_object_uid.toString(),
              lh_object_name: supertype.lh_object_name,
              rel_type_uid: "5652",
              rel_type_name:
                "has subtypes that have as discriminating aspect a",
              rh_object_uid: aspect.lh_object_uid.toString(),
              rh_object_name: aspect.lh_object_name,
              collection_uid: collection.uid,
              collection_name: collection.name,
            });
            const quality = aspectQualifications[aspects[0].lh_object_uid];
            console.log("quality", quality);
            if (quality) {
              facts.push({
                ...baseFact,
                lh_object_uid: uid.toString(),
                lh_object_name: preferredName,
                rel_type_uid: "5283",
                rel_type_name: "is by definition qualified as",
                rh_object_uid: quality.lh_object_uid.toString(),
                rh_object_name: quality.lh_object_name,
                collection_uid: collection.uid,
                collection_name: collection.name,
              });
            }
          }
        });
      }

      // Function
      //
      if (func && func.lh_object_uid && func.lh_object_name) {
        // codes.forEach((term: string) => {
        facts.push({
          ...baseFact,
          lh_object_uid: uid.toString(),
          lh_object_name: preferredName,
          rel_type_uid: "4717",
          rel_type_name: "has as an intended function a",
          rh_object_uid: func.lh_object_uid.toString(),
          rh_object_name: func.lh_object_name,
          collection_uid: collection.uid,
          collection_name: collection.name,
        });
        // });
      }

      // Part
      //
      if (part && part.lh_object_uid && part.lh_object_name) {
        // codes.forEach((term: string) => {
        facts.push({
          ...baseFact,
          lh_object_uid: uid.toString(),
          lh_object_name: preferredName,
          rel_type_uid: "5519",
          rel_type_name: "is by definition a possible part of a",
          rh_object_uid: part.lh_object_uid.toString(),
          rh_object_name: part.lh_object_name,
          collection_uid: collection.uid,
          collection_name: collection.name,
        });
        // });
      }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

export default FormListener;
