import * as React from "react";
import Grid from "@mui/material/Grid";
import { Search as SearchIcon } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";

import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const Aspect = (props: any) => {
  const { handleOpen, handleClose } = props;
  const initialValues = {
    aspect: {
      lh_object_uid: 0,
      lh_object_name: "",
    },
    parent: {
      rh_object_uid: 0,
      rh_object_name: "",
    },
  };

  return (
    <div>
      <h3>Aspect</h3>
      <p style={{ color: "#555" }}>
        An unstructured sketch re: creating/managing aspects in the model{" "}
      </p>
      <div>
        <small>
          <em>Instructions: tbd.</em>
        </small>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={5}>
          <Formik
            initialValues={initialValues}
            onSubmit={(values) => {
              console.log(values);
            }}
          >
            {({ setFieldValue, values }) => (
              <div className="section">
                <Form>
                  <label>
                    aspect-uid
                    <Field name="aspect.lh_object_uid" type="number" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("aspect", setFieldValue, 790229);
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
                  <label>
                    aspect-name
                    <Field name="aspect.lh_object_name" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("aspect", setFieldValue, 790229);
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  {/* parent */}
                  <br />
                  <label>
                    parent-uid
                    <Field name="aspect.rh_object_uid" type="number" />
                  </label>
                  <br />
                  <label>
                    parent-name
                    <Field name="aspect.rh_object_name" type="text" />
                  </label>
                  <br />
                  <h5>Qualifications</h5>
                </Form>
              </div>
            )}
          </Formik>
        </Grid>
      </Grid>
    </div>
  );
};

export default Aspect;
