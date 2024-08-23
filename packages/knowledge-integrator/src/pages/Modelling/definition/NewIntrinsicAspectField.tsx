import React, { useState } from "react";
import { useStore } from "react-admin";
import { Field, useFormikContext } from "formik";

import Grid from "@mui/material/Grid";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { IconButton } from "@mui/material";
import { conjureDefinition } from "../../../CCClient";

import MyField from "./MyField";
import QualifiedAspectField from "./QualifiedAspectField";
import KGEntityField from "../ui/KGEntityField";
import DefinitionField from "../ui/DefinitionField";

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
          <KGEntityField
            name={`intrinsicAspects.${index}.supertypeIntrinsicAspect`}
            label="supertype intrinsic aspect"
            handleOpen={handleOpen}
            searchConeUID={4289}
          />
        </Grid>
        <Grid xs={12}>
          <Grid xs={6}>
            <label>
              new intrinsic aspect name
              <Field name={`intrinsicAspects.${index}.preferredName`} />
            </label>
          </Grid>
          <Grid xs={6}>
            <DefinitionField
              name={`intrinsicAspects.${index}.definition`}
              label="definition"
            />
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
