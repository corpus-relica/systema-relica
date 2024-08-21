import React from "react";
import { useFormikContext } from "formik";

import Grid from "@mui/material/Grid";

import MyField from "./MyField";

const ExistingIntrinsicAspectField = (props: any) => {
  const { setFieldValue } = useFormikContext();
  const { handleOpen, remove, index } = props;

  return (
    <Grid xs={12}>
      <Grid xs={6}>
        <label>
          existing intrinsic aspect uid
          <MyField
            name={`intrinsicAspects.${index}.existingIntrinsicAspect.lh_object_uid`}
            onClick={() => {
              handleOpen(
                `intrinsicAspects.${index}.existingIntrinsicAspect`,
                setFieldValue,
                4289 // intrinsic aspect
              );
            }}
          />
        </label>
      </Grid>
      <Grid xs={6}>
        <label>
          existing intrinsic aspect name
          <MyField
            name={`intrinsicAspects.${index}.existingIntrinsicAspect.lh_object_name`}
            onClick={() => {
              handleOpen(
                `intrinsicAspects.${index}.existingIntrinsicAspect`,
                setFieldValue,
                4289 // intrinsic aspect
              );
            }}
          />
        </label>
      </Grid>
    </Grid>
  );
};

export default ExistingIntrinsicAspectField;
