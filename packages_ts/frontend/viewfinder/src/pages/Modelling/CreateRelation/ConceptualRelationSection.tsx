import React, { useState } from "react";

import { Field, useFormikContext } from "formik";

import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import BaseDef from "../BaseDef";

import RoleField from "./RoleField";

const RELATION_UID = 2850;
const ROLE_UID = 160170;

const ConceptualRelationSection = (props: any) => {
  const { handleOpen } = props;

  const { values, setFieldValue } = useFormikContext();

  return (
    <Grid container xs={12}>
      <Grid xs={12}>
        <h5>Conceptual Relation</h5>
      </Grid>
      <Grid xs={12}>
        <BaseDef
          subject="conceptualRelation"
          handleOpen={handleOpen}
          setFieldValue={setFieldValue}
          supertypeConeUID={RELATION_UID}
          values={values}
        />
      </Grid>
      <Grid xs={12}>
        <RoleField
          {...props}
          name="conceptualRequiredRole1"
          label="conceptual required role 1"
        />
      </Grid>
      <Grid xs={12}>
        <RoleField
          {...props}
          name="conceptualRequiredRole2"
          label="conceptual required role 2"
        />
      </Grid>
    </Grid>
  );
};

export default ConceptualRelationSection;
