import React from "react";
import Grid from "@mui/material/Grid";

import { Field } from "formik";
import KGEntityField from "../ui/KGEntityField";

const QualificationOfConceptualAspectField = (props: any) => {
  const { handleOpen, index, remove } = props;

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
          <KGEntityField
            name={`qualifications.${index}.uom`}
            label="uom"
            handleOpen={handleOpen}
            searchCone={740000}
          />
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
