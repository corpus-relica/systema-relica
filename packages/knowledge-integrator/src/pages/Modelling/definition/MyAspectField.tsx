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
import axios from "axios";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import MyField from "./MyField";

const MyAspectField = (props: any) => {
  const {
    //     values: { textA, textB },
    touched,
    setFieldValue,
  } = useFormikContext();
  const { handleOpen, remove, index } = props;
  const [field, meta] = useField(props);

  const [qualificationsUI, setQualificationsUI] = useState([]);
  const [selectedQual, setSelectedQual] = useState("");
  const [qux, setQux] = useState("");

  const handleChange = (event: SelectChangeEvent) => {
    console.log("val-->", event.target.value);
    console.log("QUX!!", qux);
    setFieldValue(
      `aspectQualifications.${field.value.lh_object_uid}`,
      qux[event.target.value]
    );
    setSelectedQual(event.target.value);
  };

  useEffect(() => {
    const fonk = async () => {
      if (field.value) {
        const foo = await axios.get(
          `http://localhost:3000/aspect/qualifications?uid=${field.value.lh_object_uid}`
        );
        console.log(foo);
        if (foo.data && foo.data.length > 0) {
          const quux = {};
          const qualifications = foo.data.map((f: any) => {
            quux[f.lh_object_uid] = f;
            return (
              <MenuItem value={f.lh_object_uid}>{f.lh_object_name}</MenuItem>
            );
          });
          setQux(quux);
          setQualificationsUI(
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedQual}
              label="Workflow"
              onChange={handleChange}
            >
              {...qualifications}
            </Select>
          );
        }
      }
    };
    console.log("FOOBARBAZ!!!");
    fonk();
  }, [field.value, selectedQual]);

  return (
    // <>
    //   <input {...props} {...field} value={field.value || ""} />
    //   {/*!!meta.touched && !!meta.error && <div>{meta.error}</div>*/}
    // </>

    <Box
      key={index}
      my={4}
      display="flex"
      gap={4}
      p={2}
      sx={{ border: "2px solid grey" }}
    >
      <label>
        discriminating aspect uid
        <MyField
          name={`aspects.${index}.lh_object_uid`}
          onClick={() => {
            handleOpen(
              `aspects.${index}`,
              setFieldValue,
              790229 // "790229 - 160170" (substraction set operation)
            );
          }}
        />
      </label>
      <label>
        discriminating aspect name
        <MyField
          name={`aspects.${index}.lh_object_name`}
          onClick={() => {
            handleOpen(
              `aspects.${index}`,
              setFieldValue,
              790229 // "790229 - 160170" (substraction set operation)
            );
          }}
        />
      </label>
      <br />
      {qualificationsUI}
      <button type="button" onClick={() => remove(index)}>
        -
      </button>
    </Box>
  );
};

export default MyAspectField;
