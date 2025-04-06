import * as React from "react";
import Grid from "@mui/material/Grid";
import { Button } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import createMutation from "../validateAndSubmitBinaryFactMutation";
import {
  SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
  SUBMIT_BINARY_FACTS_ENDPOINT,
} from "@relica/constants";
import axios from "axios";
import { baseFact } from "../baseFact";
import BaseDef from "../BaseDef";

import FormListener from "./FormListener";
import QualificationOfConceptualAspectField from "./QualificationOfConceptualAspectField";
import PossiblePossessorOfAspectField from "./PossiblePossessorOfAspectField";

import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const CreateAspect = (props: any) => {
  const { handleOpen, handleClose, collection } = props;
  const initialValues = {
    aspectName: "",
    aspectDefinition: "",
    parent: {
      rh_object_uid: 0,
      rh_object_name: "",
    },
    qualifications: [],
    possessors: [],
    collection: collection,
  };

  const [facts, setFacts] = React.useState([]);
  const [submissionStatus, setSubmissionStatus] = React.useState("none");

  const updateFacts = (facts: any) => {
    setFacts(facts);
  };

  const mutation = useMutation(createMutation(facts, setSubmissionStatus));

  return (
    <div>
      <h3>Aspect</h3>
      <p style={{ color: "#555" }}>
        An unstructured sketch re: creating aspects in the model{" "}
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
                  <Grid container xs={12}>
                    <Grid container xs={6}>
                      <BaseDef
                        subject="aspect"
                        handleOpen={handleOpen}
                        setFieldValue={setFieldValue}
                        supertypeConeUID={790229}
                        values={values}
                      />
                    </Grid>
                    <Grid container xs={6}>
                      <FieldArray name="possessors">
                        {({ push, remove }) => (
                          <div>
                            <h5>Possessors</h5>
                            {values.possessors.map((_: any, index: number) => (
                              <PossiblePossessorOfAspectField
                                {...props}
                                index={index}
                              />
                            ))}
                            <button type="button" onClick={() => push("")}>
                              +
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </Grid>
                  </Grid>
                  <Grid container xs={12}>
                    <Grid item xs={12}>
                      <FieldArray name="qualifications">
                        {({ push, remove }) => (
                          <div>
                            <h5>Qualifications</h5>
                            {values.qualifications.map(
                              (_: any, index: number) => (
                                <QualificationOfConceptualAspectField
                                  {...props}
                                  index={index}
                                />
                              )
                            )}
                            <button type="button" onClick={() => push("")}>
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

export default CreateAspect;
