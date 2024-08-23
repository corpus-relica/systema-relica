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

const QualificationOfConceptualAspectField = (props: any) => {
  const { handleOpen, index, remove } = props;

  const { values, setFieldValue } = useFormikContext();

  return (
    <Grid key={index} container xs={12}>
      <Grid xs={11}>
        <Grid key={index} container xs={12}>
          <label>Qualification</label>
          <Field name={`qualifications.${index}.name`} />
        </Grid>
        <Grid key={index} container xs={12}>
          <label>value</label>
          <Field name={`qualifications.${index}.value`} />
        </Grid>
        <Grid key={index} container xs={12}>
          <label>uom</label>
          <Field name={`qualifications.${index}.uom.lh_object_uid`} />
          <Field name={`qualifications.${index}.uom.lh_object_name`} />
          <IconButton
            aria-label="search"
            size="small"
            onClick={() => {
              handleOpen(`qualifications.${index}.uom`, setFieldValue, 740000);
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

export default QualificationOfConceptualAspectField;
