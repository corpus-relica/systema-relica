import React from "react";
import Grid from "@mui/material/Grid";
import KGEntityField from "../ui/KGEntityField";

import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const PossiblePossessorOfAspectField = (props: any) => {
  const { handleOpen, index, remove } = props;

  const { values, setFieldValue } = useFormikContext();

  return (
    <Grid key={index} container xs={12}>
      <KGEntityField
        name={`possessors.${index}`}
        label="Possessor"
        handleOpen={handleOpen}
        searchConeUID={740000}
      />
    </Grid>
  );
};

export default PossiblePossessorOfAspectField;
