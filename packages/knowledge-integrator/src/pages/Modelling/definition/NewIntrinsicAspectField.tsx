import React, { useState } from "react";
import { useStore } from "react-admin";
import { Field, useFormikContext } from "formik";

import Grid from "@mui/material/Grid";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { IconButton } from "@mui/material";
import { conjureDefinition } from "../../../CCClient";

import MyField from "./MyField";
import QualifiedAspectField from "./QualifiedAspectField";

const OPEN_AI_API_KEY = "openai_api_key";
const ANTHROPIC_API_KEY = "anthropic_api_key";

const NewIntrinsicAspectField = (props: any) => {
  const [openAIAPIKey, setOpenAIAPIKey] = useStore(OPEN_AI_API_KEY, null);

  const { values, setFieldValue } = useFormikContext();
  const { handleOpen, index } = props;

  const conjureDef = async (
    values: any,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const preferredName = values.intrinsicAspects[index].preferredName;
    const supertype = values.intrinsicAspects[index].supertypeIntrinsicAspect;
    if (openAIAPIKey !== null) {
      const completion = await conjureDefinition(
        openAIAPIKey,
        supertype.lh_object_uid,
        preferredName
      );
      setFieldValue(`intrinsicAspects.${index}.definition`, completion);
    }
  };

  return (
    <div>
      <Grid container xs={12} gap={1} direction={"row"}>
        <Grid xs={12}>
          <Grid xs={6}>
            <label>
              supertype intrinsic aspect uid
              <MyField
                name={`intrinsicAspects.${index}.supertypeIntrinsicAspect.lh_object_uid`}
                onClick={() => {
                  handleOpen(
                    `intrinsicAspects.${index}.supertypeIntrinsicAspect`,
                    setFieldValue,
                    4289 // intrinsic aspect
                  );
                }}
              />
            </label>
          </Grid>
          <Grid xs={6}>
            <label>
              supertype intrinsic aspect name
              <MyField
                name={`intrinsicAspects.${index}.supertypeIntrinsicAspect.lh_object_name`}
                onClick={() => {
                  handleOpen(
                    `intrinsicAspects.${index}.supertypeIntrinsicAspect`,
                    setFieldValue,
                    4289 // intrinsic aspect
                  );
                }}
              />
            </label>
          </Grid>
        </Grid>
        <Grid xs={12}>
          <Grid xs={6}>
            <label>
              new intrinsic aspect name
              <Field name={`intrinsicAspects.${index}.preferredName`} />
            </label>
          </Grid>
          <Grid xs={6}>
            <label>
              new intrinsic aspect textual definition
              {/*<MyField name="definition" multiline rows={4} />*/}
              <MyField
                name={`intrinsicAspects.${index}.definition`}
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

        <Grid xs={12}>
          <Grid xs={6}>
            <label>
              conceptual aspect uid
              <MyField
                name={`intrinsicAspects.${index}.conceptualAspect.lh_object_uid`}
                onClick={() => {
                  handleOpen(
                    `intrinsicAspects.${index}.conceptualAspect`,
                    setFieldValue,
                    790229 // aspect
                  );
                }}
              />
            </label>
          </Grid>
          <Grid xs={6}>
            <label>
              conceptual aspect name
              <MyField
                name={`intrinsicAspects.${index}.conceptualAspect.lh_object_name`}
                onClick={() => {
                  handleOpen(
                    `intrinsicAspects.${index}.conceptualAspect`,
                    setFieldValue,
                    790229 // aspect
                  );
                }}
              />
            </label>
          </Grid>
          <QualifiedAspectField {...props} />
        </Grid>
      </Grid>
    </div>
  );
};

export default NewIntrinsicAspectField;
