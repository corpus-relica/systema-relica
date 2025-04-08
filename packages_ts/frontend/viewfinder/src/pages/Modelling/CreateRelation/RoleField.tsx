import React, { useState } from "react";

import { Field, useFormikContext } from "formik";

import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import BaseDef from "../BaseDef";

const ROLE_UID = 160170;
const RELATION_UID = 2850;
const PHYSICAL_OBJECT_UID = 730044;

const RoleField = (props: any) => {
  const { handleOpen, name, label } = props;

  const { values, setFieldValue } = useFormikContext();

  const [roleSource, setRoleSource] = useState("");

  return (
    <Grid container xs={12}>
      <Grid xs={12}>{label}</Grid>
      <Grid xs={12}>
        <FormControl fullWidth>
          <InputLabel id="simple-select-label">Role Source</InputLabel>
          <Select
            labelId="simple-select-label"
            id="simple-select"
            value={roleSource}
            label="role source"
            onChange={(event: SelectChangeEvent) => {
              setRoleSource(event.target.value as string);
            }}
          >
            <MenuItem value={"new"}>New</MenuItem>
            <MenuItem value={"existing"}>Existing</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {/*///// NEW ROLE /////*/}
      {roleSource === "new" && (
        <>
          <Grid xs={12}>
            <BaseDef
              subject={`${name}`}
              handleOpen={handleOpen}
              setFieldValue={setFieldValue}
              supertypeConeUID={ROLE_UID}
              values={values}
            />
          </Grid>
          <Grid xs={12}>
            <label>Role Player</label>
            <Field name={`${name}RolePlayer.lh_object_uid`} type="text" />
            <Field name={`${name}RolePlayer.lh_object_name`} type="text" />
            <IconButton
              aria-label="search"
              size="small"
              onClick={() => {
                handleOpen(
                  `${name}RolePlayer`,
                  setFieldValue,
                  PHYSICAL_OBJECT_UID
                ); // "PHYSICAL_OBJECT + OCCURRENCE"
              }}
            >
              <SearchIcon fontSize="inherit" />
            </IconButton>
          </Grid>
        </>
      )}
      {/*///// EXISTING ROLE /////*/}
      {roleSource === "existing" && (
        <Grid xs={12}>
          <Field name={`${name}.lh_object_uid`} type="text" />
          <Field name={`${name}.lh_object_name`} type="text" />
          <IconButton
            aria-label="search"
            size="small"
            onClick={() => {
              handleOpen(name, setFieldValue, ROLE_UID); // "790229 - Role"
            }}
          >
            <SearchIcon fontSize="inherit" />
          </IconButton>
        </Grid>
      )}
    </Grid>
  );
};

export default RoleField;
