import React, { useState } from "react";

import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const PHYSICAL_OBJECT_UID = 730044;
const RELATION_UID = 2850;

const RequiringRelationsField = (props: any) => {
  const { handleOpen, index, remove } = props;

  const [roleIdx, setRoleIdx] = useState(0);
  const { values, setFieldValue } = useFormikContext();

  return (
    <Grid item xs={6}>
      <Grid item xs={12}>
        <FieldArray name="requiringRelations">
          {({ push, remove }) => (
            <div>
              <h5>Requiring Relations</h5>
              {values.requiringRelations.map((_: any, index: number) => (
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Field
                      name={`requiringRelations.${index}.fact.lh_object_uid`}
                      type="text"
                      onClick={() => {
                        handleOpen(
                          `requiringRelations.${index}.fact`,
                          setFieldValue,
                          RELATION_UID
                        ); // "790229 - Role"
                      }}
                    />
                    <Field
                      name={`requiringRelations.${index}.fact.lh_object_name`}
                      type="text"
                      onClick={() => {
                        handleOpen(
                          `requiringRelations.${index}.fact`,
                          setFieldValue,
                          RELATION_UID
                        ); // "790229 - Role"
                      }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel id="simple-select-label">index</InputLabel>
                      <Select
                        labelId="simple-select-label"
                        id="simple-select"
                        value={roleIdx}
                        label="role index source"
                        onChange={(event: SelectChangeEvent) => {
                          setRoleIdx(event.target.value as number);
                          setFieldValue(
                            `requiringRelations.${index}.roleIndex`,
                            event.target.value
                          );
                        }}
                      >
                        <MenuItem value={1}>requires role-1 as a</MenuItem>
                        <MenuItem value={2}>requires role-2 as a</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    {values.roleName}
                  </Grid>
                </Grid>
              ))}
              <button type="button" onClick={() => push({})}>
                +
              </button>
            </div>
          )}
        </FieldArray>
      </Grid>
    </Grid>
  );
};

export default RequiringRelationsField;
