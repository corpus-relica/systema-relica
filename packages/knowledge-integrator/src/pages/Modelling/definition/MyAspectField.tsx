import React, { useState } from "react";
import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";

import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import NewIntrinsicAspectField from "./NewIntrinsicAspectField";
import ExistingIntrinsicAspectField from "./ExistingIntrinsicAspectField";

const MyAspectField = (props: any) => {
  const { remove, index } = props;

  const [intrinsicAspectSource, setIntrinsicAspectSource] = useState("");

  return (
    <Box
      key={index}
      my={4}
      display="flex"
      gap={4}
      p={2}
      sx={{ border: "2px solid grey", fontSize: "0.75rem" }}
    >
      <Grid container direction={"column"} xs={12}>
        <Grid xs={12}>
          <FormControl fullWidth>
            <InputLabel id="simple-select-label">
              Intrinsic Aspect Source
            </InputLabel>
            <Select
              labelId="simple-select-label"
              id="simple-select"
              value={intrinsicAspectSource}
              label="intrinsic aspect source"
              onChange={(event: SelectChangeEvent) => {
                setIntrinsicAspectSource(event.target.value as string);
              }}
            >
              <MenuItem value={"new"}>New</MenuItem>
              <MenuItem value={"existing"}>Existing</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid container xs={12} gap={1}>
          {intrinsicAspectSource === "new" && (
            <NewIntrinsicAspectField
              {...props}
              name={"intrinsicAspects." + index}
            />
          )}
          {intrinsicAspectSource === "existing" && (
            <ExistingIntrinsicAspectField
              {...props}
              name={"intrinsicAspects." + index}
            />
          )}
        </Grid>
        <Grid container xs={12} gap={1}>
          <Button
            onClick={() => {
              remove();
            }}
          >
            Remove
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MyAspectField;
