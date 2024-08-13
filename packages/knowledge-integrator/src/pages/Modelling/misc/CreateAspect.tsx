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

import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    // console.log("Form values changed:", values);
    // Perform any desired action when form values change
    const {
      supertype,
      aspectName,
      aspectDefinition,
      qualifications,
      collection,
    } = values;

    const facts = [];
    let definitiveFact = null;

    let definitiveUid = 1;
    let uid = definitiveUid;

    if (supertype && aspectName && aspectDefinition) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: aspectName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: supertype.lh_object_uid.toString(),
        rh_object_name: supertype.lh_object_name,
        full_definition: aspectDefinition,
        partial_definition: aspectDefinition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
      uid++;

      if (qualifications && qualifications.length > 0) {
        qualifications.forEach((qual: string) => {
          if (!qual) return;
          facts.push({
            ...baseFact,
            lh_object_uid: uid.toString(),
            lh_object_name: qual,
            rel_type_uid: "1726",
            rel_type_name: "is a qualification of",
            rh_object_uid: definitiveUid,
            rh_object_name: aspectName,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
          uid++;
        });
      }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

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
                  <BaseDef
                    subject="aspect"
                    handleOpen={handleOpen}
                    setFieldValue={setFieldValue}
                    supertypeConeUID={790229}
                    values={values}
                  />
                  <br />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FieldArray name="qualifications">
                        {({ push, remove }) => (
                          <div>
                            <h5>Qualifications</h5>
                            {values.qualifications.map(
                              (_: any, index: number) => (
                                <div key={index}>
                                  <label>
                                    <Field name={`qualifications.${index}`} />
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
