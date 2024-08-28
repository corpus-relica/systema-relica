import React from "react";
import Grid from "@mui/material/Grid";
import { Field, useFormikContext } from "formik";
import IconButton from "@mui/material/IconButton";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import { conjureDefinition } from "../../../CCClient";

import { useStore } from "react-admin";

import _ from "lodash";

const OPEN_AI_API_KEY = "openai_api_key";

const DefinitionField = (props: any) => {
  const [openAIAPIKey, setOpenAIAPIKey] = useStore(OPEN_AI_API_KEY, null);
  const { name, termName, supertype, label } = props;
  const { values, setFieldValue } = useFormikContext();

  const conjureDef = async (
    values: any,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const preferredName = _.get(values, termName);
    const st = _.get(values, supertype);

    console.log("PN", preferredName);
    console.log("ST", st);

    if (openAIAPIKey !== null) {
      const completion = await conjureDefinition(
        openAIAPIKey,
        st.lh_object_uid,
        preferredName
      );
      setFieldValue(name, completion);
    }
  };

  return (
    <>
      <Grid xs={12}>{label}</Grid>
      <Grid xs={12}>
        <Field
          name={name}
          type="text"
          as="textarea"
          placeholder="Enter definition here"
          multiLine
          rows={4}
          fullWidth
        />
        <IconButton onClick={() => conjureDef(values, setFieldValue)}>
          <AutoAwesomeIcon />
        </IconButton>
      </Grid>
    </>
  );
};

export default DefinitionField;
