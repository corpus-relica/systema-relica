import * as React from "react";
import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { Button } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { baseFact } from "../baseFact";
import BaseDef from "../BaseDef";
import createMutation from "../validateAndSubmitBinaryFactMutation";
import { useStore } from "react-admin";

import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const RELATION_UID = 2850;
const ROLE_UID = 160170;
const PHYSICAL_OBJECT_UID = 730044;

const date = new Date();
const formattedDate = date.toISOString().slice(0, 10);

const OPEN_AI_API_KEY = "openai_api_key";
const ANTHROPIC_API_KEY = "anthropic_api_key";

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    console.log(values);
    const {
      supertype,
      roleName,
      roleDefinition,
      rolePlayers,
      requiringRelations,
      collection,
    } = values;

    const facts = [];
    let definitiveFact = null;

    let definitiveUid = 1;
    let uid = definitiveUid;

    if (supertype && roleName && roleDefinition) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: roleName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: supertype.lh_object_uid.toString(),
        rh_object_name: supertype.lh_object_name,
        full_definition: roleDefinition,
        partial_definition: roleDefinition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
      uid++;

      if (rolePlayers && rolePlayers.length > 0) {
        rolePlayers.forEach((player: any) => {
          if (!player) return;
          facts.push({
            ...baseFact,
            lh_object_uid: player.lh_object_uid,
            lh_object_name: player.lh_object_name,
            rel_type_uid: "5343",
            rel_type_name: "can by definition have a role as a",
            rh_object_uid: definitiveUid,
            rh_object_name: roleName,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          uid++;
        });
      }

      // if (requiringRelations && requiringRelations.length > 0) {
      //   requiringRelations.forEach((relation: any) => {
      //     if (!relation) return;
      //     facts.push({
      //       ...baseFact,
      //       lh_object_uid: relation.lh_object_uid,
      //       lh_object_name: relation.lh_object_name,
      //       rel_type_uid: "5343",
      //       rel_type_name: "can by definition have a role as a",
      //       rh_object_uid: definitiveUid,
      //       rh_object_name: roleName,
      //     });
      //     uid++;
      //   });
      // }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

const CreateRole = (props: any) => {
  const [openAIAPIKey, setOpenAIAPIKey] = useStore(OPEN_AI_API_KEY, null);
  const [anthropicAPIKey, setAnthropicAPIKey] = useStore(
    ANTHROPIC_API_KEY,
    null
  );

  const { handleOpen, handleClose, collection } = props;
  const initialValues = {
    roleName: "",
    roleDefinition: "",
    parent: {
      rh_object_uid: 0,
      rh_object_name: "",
    },
    rolePlayers: [],
    requiringRelations: [],
    collection: collection,
  };

  const [facts, setFacts] = React.useState([]);
  const [submissionStatus, setSubmissionStatus] = React.useState("none");

  const updateFacts = (facts: any) => {
    setFacts(facts);
  };

  const mutation = useMutation(createMutation(facts, setSubmissionStatus));

  const conjureDef = async (
    values: any,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const { preferredName, supertype } = values;
    if (openAIAPIKey !== null) {
      const completion = await conjureDefinition(
        openAIAPIKey,
        supertype.lh_object_uid,
        preferredName
      );
      setFieldValue("definition", completion.data);
    }
  };

  return (
    <div>
      <h3>Role</h3>
      <p style={{ color: "#555" }}>
        An unstructured sketch re: creating roles in the model
      </p>
      <div>
        <small>
          <em>Instructions: tbd.</em>
        </small>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Formik
            initialValues={initialValues}
            onSubmit={(values) => {
              mutation.mutate(facts);
            }}
          >
            {({ setFieldValue, values }) => (
              <div className="section">
                <Form>
                  <BaseDef
                    subject="role"
                    handleOpen={handleOpen}
                    setFieldValue={setFieldValue}
                    supertypeConeUID={ROLE_UID}
                    values={values}
                  />
                  <br />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FieldArray name="rolePlayers">
                        {({ push, remove }) => (
                          <div>
                            <h5>Role Players</h5>
                            {values.rolePlayers.map((_: any, index: number) => (
                              <div key={index}>
                                <label>
                                  <Field
                                    name={`rolePlayers.${index}.lh_object_uid`}
                                    type="text"
                                  />
                                  <Field
                                    name={`rolePlayers.${index}.lh_object_name`}
                                    type="text"
                                  />
                                  <IconButton
                                    aria-label="search"
                                    size="small"
                                    onClick={() => {
                                      handleOpen(
                                        `rolePlayers.${index}`,
                                        setFieldValue,
                                        PHYSICAL_OBJECT_UID
                                      ); // Just Physical Object, or (Physcal Object + Occurrence) too ?? Aspect too??
                                    }}
                                  >
                                    <SearchIcon fontSize="inherit" />
                                  </IconButton>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                >
                                  -
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => push({})}>
                              +
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </Grid>
                    <br />
                    {/*<Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FieldArray name="requiringRelations">
                          {({ push, remove }) => (
                            <div>
                              <h5>Requiring Relations</h5>
                              {values.requiringRelations.map(
                                (_: any, index: number) => (
                                  <div key={index}>
                                    <label>
                                      <Field
                                        name={`requiringRelations.${index}.lh_object_uid`}
                                        type="text"
                                      />
                                      <Field
                                        name={`requiringRelations.${index}.lh_object_name`}
                                        type="text"
                                      />
                                      <IconButton
                                        aria-label="search"
                                        size="small"
                                        onClick={() => {
                                          handleOpen(
                                            `requiringRelations.${index}`,
                                            setFieldValue,
                                            RELATION_UID
                                          ); // Just Physical Object, or (Physcal Object + Occurrence) too ?? Aspect too??
                                        }}
                                      >
                                        <SearchIcon fontSize="inherit" />
                                      </IconButton>
                                    </label>

                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                    >
                                      -
                                    </button>
                                  </div>
                                )
                              )}
                              <button type="button" onClick={() => push({})}>
                                +
                              </button>
                            </div>
                          )}
                        </FieldArray>
                      </Grid>
                    </Grid>*/}
                    <Grid item xs={12}>
                      <Table rows={facts} height={250} />
                    </Grid>
                  </Grid>
                  <Button type="submit">Submit</Button>
                  {submissionStatus === "pending" && <div>Submitting...</div>}
                  {submissionStatus === "success" && <div>Success!</div>}
                  {submissionStatus === "error" && <div>Error!</div>}
                  <FormListener updateFacts={updateFacts} />
                </Form>
              </div>
            )}
          </Formik>
        </Grid>
      </Grid>
    </div>
  );
};

export default CreateRole;
