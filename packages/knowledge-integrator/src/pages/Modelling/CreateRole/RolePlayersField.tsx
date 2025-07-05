import React from "react";
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

const PHYSICAL_OBJECT_UID = 730044;

const RolePlayersField = (props: any) => {
  const { handleOpen, index, remove } = props;

  const { values, setFieldValue } = useFormikContext();

  return (
    <Grid item xs={6} direction={"column"}>
      <Grid container xs={12}>
        <Grid xs={6}>
          <FieldArray name="definitiveRolePlayers">
            {({ push, remove }) => (
              <Grid item xs={12}>
                <h5>Role Players By Definition</h5>
                {values.definitiveRolePlayers.map((_: any, index: number) => (
                  <div key={index}>
                    <label>
                      <Field
                        name={`definitiveRolePlayers.${index}.lh_object_uid`}
                        type="text"
                      />
                      <Field
                        name={`definitiveRolePlayers.${index}.lh_object_name`}
                        type="text"
                      />
                      <IconButton
                        aria-label="search"
                        size="small"
                        onClick={() => {
                          handleOpen(
                            `definitiveRolePlayers.${index}`,
                            setFieldValue,
                            PHYSICAL_OBJECT_UID
                          ); // Just Physical Object, or (Physcal Object + Occurrence) too ?? Aspect too??
                        }}
                      >
                        <SearchIcon fontSize="inherit" />
                      </IconButton>
                    </label>

                    <button type="button" onClick={() => remove(index)}>
                      -
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => push({})}>
                  +
                </button>
              </Grid>
            )}
          </FieldArray>
        </Grid>
        <Grid item xs={6}>
          <FieldArray name="possibleRolePlayers">
            {({ push, remove }) => (
              <Grid item xs={6}>
                <h5>Possible Role Players</h5>
                {values.possibleRolePlayers.map((_: any, index: number) => (
                  <div key={index}>
                    <label>
                      <Field
                        name={`possibleRolePlayers.${index}.lh_object_uid`}
                        type="text"
                      />
                      <Field
                        name={`possibleRolePlayers.${index}.lh_object_name`}
                        type="text"
                      />
                      <IconButton
                        aria-label="search"
                        size="small"
                        onClick={() => {
                          handleOpen(
                            `possibleRolePlayers.${index}`,
                            setFieldValue,
                            PHYSICAL_OBJECT_UID
                          ); // Just Physical Object, or (Physcal Object + Occurrence) too ?? Aspect too??
                        }}
                      >
                        <SearchIcon fontSize="inherit" />
                      </IconButton>
                    </label>

                    <button type="button" onClick={() => remove(index)}>
                      -
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => push({})}>
                  +
                </button>
              </Grid>
            )}
          </FieldArray>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default RolePlayersField;
