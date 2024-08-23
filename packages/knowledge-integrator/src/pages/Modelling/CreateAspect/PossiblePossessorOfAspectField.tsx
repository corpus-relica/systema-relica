import React from "react";
import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";

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
      <Grid xs={11}>
        <Grid key={index} container xs={12}>
          <label>Possessor</label>
          <Field name={`possessors.${index}.lh_object_uid`} />
          <Field name={`possessors.${index}.lh_object_name`} />
          <IconButton
            aria-label="search"
            size="small"
            onClick={() => {
              handleOpen(`possessors.${index}`, setFieldValue, 740000);
            }}
          >
            <SearchIcon fontSize="inherit" />
          </IconButton>
        </Grid>
      </Grid>
      <Grid xs={1}>
        <button type="button" onClick={() => remove(index)}>
          -
        </button>
      </Grid>
    </Grid>
  );
};

export default PossiblePossessorOfAspectField;
