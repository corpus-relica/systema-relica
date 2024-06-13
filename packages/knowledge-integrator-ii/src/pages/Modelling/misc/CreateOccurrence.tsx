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
const OCCURRENCE_UID = 193671;
const INVOLVEMENT_UID = 4767;
const INVOLVER_UID = 4773;
const INVOLVED_UID = 4546;

const date = new Date();
const formattedDate = date.toISOString().slice(0, 10);

const InvolvementDef = (props: any) => {
  const { index, handleOpen, setFieldValue, supertypeConeUID } = props;

  return (
    <>
      <label>
        supertype
        <Field
          name={`involvements.${index}.supertype.lh_object_uid`}
          type="text"
        />
        <Field
          name={`involvements.${index}.supertype.lh_object_name`}
          type="text"
        />
        <IconButton
          aria-label="search"
          size="small"
          onClick={() => {
            handleOpen(
              `involvements.${index}.supertype`,
              setFieldValue,
              supertypeConeUID
            ); // "790229 - Role"
          }}
        >
          <SearchIcon fontSize="inherit" />
        </IconButton>
      </label>
      <br />
      <label>
        new involvement name
        <Field name={`involvements.${index}.name`} type="" />
      </label>
      <br />
      <label>
        involvement definition
        <Field name={`involvements.${index}.definition`} type="text" />
      </label>
      <br />
      <label>
        involvement required role 1
        <Field
          name={`involvements.${index}.requiredRole1.lh_object_uid`}
          type="text"
        />
        <Field
          name={`involvements.${index}.requiredRole1.lh_object_name`}
          type="text"
        />
        <IconButton
          aria-label="search"
          size="small"
          onClick={() => {
            handleOpen(
              `involvements.${index}.requiredRole1`,
              setFieldValue,
              INVOLVED_UID
            );
          }}
        >
          <SearchIcon fontSize="inherit" />
        </IconButton>
      </label>
      <br />
      <label>
        involvement required role 2
        <Field
          name={`involvements.${index}.requiredRole2.lh_object_uid`}
          type="text"
        />
        <Field
          name={`involvements.${index}.requiredRole2.lh_object_name`}
          type="text"
        />
        <IconButton
          aria-label="search"
          size="small"
          onClick={() => {
            handleOpen(
              `involvements.${index}.requiredRole2`,
              setFieldValue,
              INVOLVER_UID
            );
          }}
        >
          <SearchIcon fontSize="inherit" />
        </IconButton>
      </label>
    </>
  );
};

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    console.log(values);
    const {
      supertype,
      occurrenceName,
      occurrenceDefinition,
      involvements,
      collection,
    } = values;

    const facts = [];
    let definitiveFact = null;

    let definitiveUid = 1;
    let uid = definitiveUid;

    if (supertype && occurrenceName && occurrenceDefinition) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: occurrenceName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: supertype.lh_object_uid.toString(),
        rh_object_name: supertype.lh_object_name,
        full_definition: occurrenceDefinition,
        partial_definition: occurrenceDefinition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
      uid++;
    }

    if (involvements.length > 0) {
      involvements.forEach((involvement: any) => {
        const involvementUID = uid;
        if (
          involvement.supertype &&
          involvement.name &&
          involvement.definition
        ) {
          definitiveFact = facts.push({
            ...baseFact,
            lh_object_uid: uid.toString(),
            lh_object_name: involvement.name,
            rel_type_uid: "1146",
            rel_type_name: "is a specialization of",
            rh_object_uid: involvement.supertype.lh_object_uid.toString(),
            rh_object_name: involvement.supertype.lh_object_name,
            full_definition: involvement.definition,
            partial_definition: involvement.definition,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          uid++;
        }

        if (involvement.requiredRole1 && involvement.requiredRole2) {
          facts.push({
            ...baseFact,
            lh_object_uid: involvementUID.toString(),
            lh_object_name: involvement.name,
            rel_type_uid: "4731",
            rel_type_name: "requires a role-1 as a",
            rh_object_uid: involvement.requiredRole1.lh_object_uid.toString(),
            rh_object_name: involvement.requiredRole1.lh_object_name,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          facts.push({
            ...baseFact,
            lh_object_uid: involvementUID.toString(),
            lh_object_name: involvement.name,
            rel_type_uid: "4733",
            rel_type_name: "requires a role-2 as a",
            rh_object_uid: involvement.requiredRole2.lh_object_uid.toString(),
            rh_object_name: involvement.requiredRole2.lh_object_name,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          facts.push({
            ...baseFact,
            lh_object_uid: definitiveUid,
            lh_object_name: occurrenceName,
            rel_type_uid: "5343",
            rel_type_name: "can by definition have a role as a",
            rh_object_uid: involvement.requiredRole2.lh_object_uid.toString(),
            rh_object_name: involvement.requiredRole2.lh_object_name,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
        }
      });
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

const CreateOccurrence = (props: any) => {
  const { handleOpen, handleClose, collection } = props;
  const initialValues = {
    occurrenceName: "",
    occurrenceDefinition: "",
    parent: {
      rh_object_uid: 0,
      rh_object_name: "",
    },
    involvements: [],
    collection: collection,
  };

  const [facts, setFacts] = React.useState([]);

  const updateFacts = (facts: any) => {
    setFacts(facts);
  };

  const mutation = useMutation(createMutation(facts));

  return (
    <div>
      <h3>Occurrence</h3>
      <p style={{ color: "#555" }}>
        An unstructured sketch re: creating occurrences in the model
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
            onSubmit={
              (values) => mutation.mutate(facts)
              // setTimeout(() => {
              //   alert(JSON.stringify(facts, null, 2));
              // }, 500)
            }
          >
            {({ setFieldValue, values }) => (
              <div className="section">
                <Form>
                  <BaseDef
                    subject="occurrence"
                    handleOpen={handleOpen}
                    setFieldValue={setFieldValue}
                    supertypeConeUID={OCCURRENCE_UID}
                  />
                  <br />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FieldArray name="involvements">
                        {({ push, remove }) => (
                          <div>
                            <h5>Involvement</h5>
                            {values.involvements.map(
                              (_: any, index: number) => (
                                <div key={index}>
                                  <label>
                                    <InvolvementDef
                                      index={index}
                                      handleOpen={handleOpen}
                                      setFieldValue={setFieldValue}
                                      supertypeConeUID={INVOLVEMENT_UID}
                                    />
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
                    <Grid item xs={12}>
                      <Table rows={facts} height={250} />
                    </Grid>
                  </Grid>
                  <Button type="submit">Submit</Button>
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

export default CreateOccurrence;
