import React from "react";
import Grid from "@mui/material/Grid";
import { Field } from "formik";

import KGEntityField from "./ui/KGEntityField";
import DefinitionField from "./ui/DefinitionField";

const BaseDef = (props: any) => {
  const { subject, handleOpen, setFieldValue, supertypeConeUID } = props;

  return (
    <Grid container xs={12}>
      <Grid xs={12}>
        <KGEntityField
          name={`${subject}Supertype`}
          label="supertype"
          handleOpen={handleOpen}
          searchConeUID={supertypeConeUID}
        />
      </Grid>
      <Grid xs={12}>
        <Grid xs={12}>new {subject} name</Grid>
        <Grid xs={12}>
          <Field name={`${subject}Name`} type="" />
        </Grid>
      </Grid>
      <Grid xs={12}>
        <DefinitionField
          name={`${subject}Definition`}
          label={`new ${subject} definition`}
          termName={`${subject}Name`}
          supertype={`${subject}Supertype`}
        />
      </Grid>
    </Grid>
  );
};

export default BaseDef;
