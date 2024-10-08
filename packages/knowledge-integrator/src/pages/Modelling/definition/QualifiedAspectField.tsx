import React, { useEffect, useState } from "react";
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
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import ExistingQualifiedAspectField from "./ExistingQualifiedAspectField";
import NewQualificationOfAspectField from "./NewQualificationOfAspectField";

const QualifiedAspectField = (props: any) => {
  const { index } = props;

  const [qualifiedAspectSource, setQualifiedAspectSource] = useState("");

  return (
    <Box
      key={index}
      my={4}
      display="flex"
      gap={4}
      p={2}
      sx={{ border: "2px solid grey", fontSize: "0.75rem" }}
    >
      <Grid container direction={"column"}>
        <Grid sx={12}>
          <FormControl fullWidth>
            <InputLabel id="simple-select-label">
              Qualification of Conceptual Aspect Source
            </InputLabel>
            <Select
              labelId="simple-select-label"
              id="simple-select"
              value={qualifiedAspectSource}
              label="qualification of conceptual aspect source"
              onChange={(event: SelectChangeEvent) => {
                setQualifiedAspectSource(event.target.value as string);
              }}
            >
              <MenuItem value={"new"}>New</MenuItem>
              <MenuItem value={"existing"}>Existing</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid container sx={12} gap={1}>
          {qualifiedAspectSource === "new" ? (
            <NewQualificationOfAspectField {...props} />
          ) : (
            <ExistingQualifiedAspectField {...props} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default QualifiedAspectField;
