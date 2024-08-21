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
import MyField from "./MyField";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import NewIntrinsicAspectField from "./NewIntrinsicAspectField";
import ExistingIntrinsicAspectField from "./ExistingIntrinsicAspectField";

const MyAspectField = (props: any) => {
  const {
    //     values: { textA, textB },
    touched,
    setFieldValue,
  } = useFormikContext();
  const { handleOpen, remove, index } = props;
  const [field, meta] = useField(props);

  const [selectedQual, setSelectedQual] = useState("");
  const [qux, setQux] = useState("");
  const [intrinsicAspectSource, setIntrinsicAspectSource] = useState("");

  const handleChange = (event: SelectChangeEvent) => {
    console.log("val-->", event.target.value);
    console.log("QUX!!", qux);
    setFieldValue(
      `aspectQualifications.${field.value.lh_object_uid}`,
      qux[event.target.value]
    );
    setSelectedQual(event.target.value);
  };

  // useEffect(() => {
  //   const fonk = async () => {
  //     if (field.value) {
  //       const foo = await axios.get(
  //         `http://localhost:3000/aspect/qualifications?uid=${field.value.lh_object_uid}`
  //       );
  //       console.log(foo);
  //       if (foo.data && foo.data.length > 0) {
  //         const quux = {};
  //         const qualifications = foo.data.map((f: any) => {
  //           quux[f.lh_object_uid] = f;
  //           return (
  //             <MenuItem value={f.lh_object_uid}>{f.lh_object_name}</MenuItem>
  //           );
  //         });
  //         setQux(quux);
  //         setQualificationsUI(
  //           <Select
  //             labelId="demo-simple-select-label"
  //             id="demo-simple-select"
  //             value={selectedQual}
  //             label="Workflow"
  //             onChange={handleChange}
  //           >
  //             {...qualifications}
  //           </Select>
  //         );
  //       }
  //     }
  //   };
  //   console.log("FOOBARBAZ!!!");
  //   fonk();
  // }, [field.value, selectedQual]);

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
        <Grid container sx={12} gap={1}>
          {intrinsicAspectSource === "new" ? (
            <NewIntrinsicAspectField
              {...props}
              name={"intrinsicAspects." + index}
            />
          ) : (
            <ExistingIntrinsicAspectField
              {...props}
              name={"intrinsicAspects." + index}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MyAspectField;
