import React, { useState } from "react";

import { Field, useFormikContext } from "formik";

import Grid from "@mui/material/Grid";
import { Search as SearchIcon } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import BaseDef from "../BaseDef";

import RoleField from "./RoleField";

const RELATION_UID = 2850;
const ROLE_UID = 160170;

const RealizedRelationSection = (props: any) => {
  const { handleOpen } = props;

  const { values, setFieldValue } = useFormikContext();

  return (
    <Grid container xs={12}>
      <Grid xs={12}>
        <h5>Realized Relation</h5>
      </Grid>
      <Grid xs={12}>
        <BaseDef
          subject="realizedRelation"
          handleOpen={handleOpen}
          setFieldValue={setFieldValue}
          supertypeConeUID={RELATION_UID}
          values={values}
        />
      </Grid>
      <Grid xs={12}>
        <RoleField
          {...props}
          name="realizedRequiredRole1"
          label="realized required role 1"
        />
      </Grid>
      <Grid xs={12}>
        <RoleField
          {...props}
          name="realizedRequiredRole2"
          label="realized required role 2"
        />
      </Grid>
    </Grid>
  );
};

export default RealizedRelationSection;
