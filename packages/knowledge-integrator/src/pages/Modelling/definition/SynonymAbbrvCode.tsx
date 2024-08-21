import React from "react";
import Grid from "@mui/material/Grid";
import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";
import MyField from "./MyField";

const SynonymAbbrvCode = (props: { synonyms; abbreviations; codes }) => {
  const { synonyms, abbreviations, codes } = props;
  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <FieldArray name="synonyms">
            {({ push, remove }) => (
              <div>
                <h5>synonyms</h5>
                {synonyms.map((_: any, index: number) => (
                  <div key={index}>
                    <label>
                      <MyField name={`synonyms.${index}`} />
                    </label>
                    <button type="button" onClick={() => remove(index)}>
                      -
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => push("")}>
                  +
                </button>
              </div>
            )}
          </FieldArray>
        </Grid>
        <Grid item xs={4}>
          <FieldArray name="abbreviations">
            {({ push, remove }) => (
              <div>
                <h5>abbreviations</h5>
                {abbreviations.map((_: any, index: number) => (
                  <div key={index}>
                    <label>
                      <MyField name={`abbreviations.${index}`} />
                    </label>
                    <button type="button" onClick={() => remove(index)}>
                      -
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => push("")}>
                  +
                </button>
              </div>
            )}
          </FieldArray>
        </Grid>
        <Grid item xs={4}>
          <FieldArray name="codes">
            {({ push, remove }) => (
              <div>
                <h5>codes</h5>
                {codes.map((_: any, index: number) => (
                  <div key={index}>
                    <label>
                      <MyField name={`codes.${index}`} />
                    </label>
                    <button type="button" onClick={() => remove(index)}>
                      -
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => push("")}>
                  +
                </button>
              </div>
            )}
          </FieldArray>
        </Grid>
      </Grid>
      <br />
    </div>
  );
};

export default SynonymAbbrvCode;
