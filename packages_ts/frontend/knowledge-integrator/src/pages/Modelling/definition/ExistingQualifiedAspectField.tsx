import React, { useEffect, useState } from "react";
import { useField, useFormikContext } from "formik";
import axios from "axios";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";

const ExistingQualifiedAspectField = (props: any) => {
  const { index } = props;
  const { setFieldValue } = useFormikContext();
  const [qux, setQux] = useState("");
  const [field, meta] = useField(props);
  const [qualificationsUI, setQualificationsUI] = useState([]);
  const [selectedQual, setSelectedQual] = useState("");

  const handleChange = (event: SelectChangeEvent) => {
    console.log("val-->", event.target.value);
    console.log("QUX!!", qux);
    setFieldValue(
      `intrinsicAspects.${index}.existingQualificationOfConceptualAspect`,
      qux[event.target.value]
    );
    // setFieldValue(
    //   `aspectQualifications.${field.value.lh_object_uid}`,
    //   qux[event.target.value]
    // );
    setSelectedQual(event.target.value);
  };

  useEffect(() => {
    const fonk = async () => {
      console.log(field);
      if (field.value && field.value.conceptualAspect) {
        const foo = await axios.get(
          `${
            import.meta.env.VITE_RELICA_ARCHIVIST_API_URL
          }/aspect/qualifications?uid=${
            field.value.conceptualAspect.lh_object_uid
          }`
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

  return <div>{qualificationsUI}</div>;
};

export default ExistingQualifiedAspectField;
