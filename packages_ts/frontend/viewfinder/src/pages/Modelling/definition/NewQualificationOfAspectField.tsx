import React, { useEffect, useState } from "react";
import { useStore } from "react-admin";
import { Field, useFormikContext } from "formik";

import Grid from "@mui/material/Grid";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { IconButton } from "@mui/material";
import { conjureDefinition } from "../../../io/CCBaseClient.js";

import MyField from "./MyField";

const OPEN_AI_API_KEY = "openai_api_key";
const ANTHROPIC_API_KEY = "anthropic_api_key";

const NewQualificationOfAspectField = (props: any) => {
  const [openAIAPIKey, setOpenAIAPIKey] = useStore(OPEN_AI_API_KEY, null);
  const { setFieldValue } = useFormikContext();
  const { index } = props;
  const { values } = useFormikContext();

  const [conceptualAspectName, setConceptualAspectName] = useState("");
  const [conceptualAspectUID, setConceptualAspectUID] = useState(undefined);

  useEffect(() => {
    setConceptualAspectName(
      values.intrinsicAspects[index]?.conceptualAspect.lh_object_name
    );
    setConceptualAspectUID(
      values.intrinsicAspects[index]?.conceptualAspect.lh_object_uid
    );
  }, []);

  const conjureDef = async (
    values: any,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const preferredName =
      values.intrinsicAspects[index].newQualificationOfConceptualAspect
        .preferredName;
    if (openAIAPIKey !== null) {
      const completion = await conjureDefinition(
        openAIAPIKey,
        conceptualAspectUID,
        preferredName
      );
      setFieldValue(
        `intrinsicAspects.${index}.newQualificationOfConceptualAspect.definition`,
        completion
      );
    }
  };

  return (
    <Grid xs={12}>
      <Grid xs={6}>
        <label>
          new qualification of aspect {conceptualAspectName}
          <Field
            name={`intrinsicAspects.${index}.newQualificationOfConceptualAspect.preferredName`}
          />
        </label>
      </Grid>
      <Grid xs={6}>
        <label>
          new intrinsic aspect textual definition
          <MyField
            name={`intrinsicAspects.${index}.newQualificationOfConceptualAspect.definition`}
            as="textarea"
            placeholder="Enter definition here"
            multiLine
            rows={4}
            fullWidth
          />
          <IconButton onClick={() => conjureDef(values, setFieldValue)}>
            <AutoAwesomeIcon />
          </IconButton>
        </label>
      </Grid>
    </Grid>
  );
};

export default NewQualificationOfAspectField;
