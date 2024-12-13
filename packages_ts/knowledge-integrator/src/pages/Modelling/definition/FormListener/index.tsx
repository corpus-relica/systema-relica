import React from "react";
import { useFormikContext } from "formik";

import { plusDefinitiveFact } from "../../FormListener/plusDefinitiveFact";

import { plusSynonymFacts } from "./plusSynonymFacts";
import { plusAbbreviationFacts } from "./plusAbbreviationFacts";
import { plusCodeFacts } from "./plusCodeFacts";
import { plusIntrinsicAspectFacts } from "./plusIntrinsicAspectFacts";
import { plusIntendedFunctionFacts } from "./plusIntendedFunctionFacts";
import { plusCompositionFacts } from "./plusCompositionFacts";

import { Fact } from "../../../../types";

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
      intrinsicAspects,
      aspect,
      aspectValue,
      func,
      definition,
      aspectValueUom,
      part,
      aspectQualifications,
      collection,
    } = values;

    let facts: Fact[] = [];
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
      facts = plusDefinitiveFact({
        facts,
        uid,
        preferredName,
        supertype,
        definition,
        collection,
      });

      facts = plusSynonymFacts({
        facts,
        uid,
        preferredName,
        synonyms,
        collection,
      });

      facts = plusAbbreviationFacts({
        facts,
        uid,
        preferredName,
        abbreviations,
        collection,
      });

      facts = plusCodeFacts({
        facts,
        uid,
        preferredName,
        codes,
        collection,
      });

      facts = plusIntrinsicAspectFacts({
        facts,
        uid,
        preferredName,
        supertype,
        intrinsicAspects,
        collection,
      });

      facts = plusIntendedFunctionFacts({
        facts,
        uid,
        preferredName,
        func,
        collection,
      });

      facts = plusCompositionFacts({
        facts,
        uid,
        preferredName,
        part,
        collection,
      });
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

export default FormListener;
