import React from "react";

import Grid from "@mui/material/Grid";

import KGEntityField from "../ui/KGEntityField";

const ExistingIntrinsicAspectField = (props: any) => {
  const { handleOpen, index } = props;

  return (
    <Grid xs={12}>
      <KGEntityField
        name={`intrinsicAspects.${index}.existingIntrinsicAspect`}
        label="Existing Intrinsic Aspect"
        handleOpen={handleOpen}
        searchConeUID={4289}
      />
    </Grid>
  );
};

export default ExistingIntrinsicAspectField;
