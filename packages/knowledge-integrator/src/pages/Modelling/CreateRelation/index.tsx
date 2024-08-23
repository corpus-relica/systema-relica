import * as React from "react";

import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { Button } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import BaseDef from "../BaseDef";
import createMutation from "../validateAndSubmitBinaryFactMutation";

import ConceptualRelationSection from "./ConceptualRelationSection";
import RealizedRelationSection from "./RealizedRelationSection";

import FormListener from "./FormListener";

import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const CreateRelation = (props: any) => {
  const { handleOpen, handleClose, collection } = props;
  const [submissionStatus, setSubmissionStatus] = React.useState("none");
  const [facts, setFacts] = React.useState([]);

  const mutation = useMutation(createMutation(facts, setSubmissionStatus));

  const updateFacts = (facts: any) => {
    setFacts(facts);
  };

  const initialValues = {
    // realizedRelationName: "",
    // realizedRelationDefinition: "",
    // realizedRelationParent: {
    //   rh_object_uid: 0,
    //   rh_object_name: "",
    // },
    // realizedRequiredRole1: {},
    // realizedRequiredRole2: {},
    // collection: collection,
  };

  return (
    <div>
      <h3>Relation</h3>
      <p style={{ color: "#555" }}>
        An unstructured sketch re: creating relations in the model
      </p>
      <div>
        <small>
          <em>Instructions: tbd.</em>
        </small>
      </div>
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
                <Grid xs={6}>
                  <RealizedRelationSection {...props} />
                </Grid>
                <Grid xs={6}>
                  <ConceptualRelationSection {...props} />
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Table rows={facts} height={250} />
                  </Grid>
                </Grid>
                <Button type="submit">Submit</Button>
                {submissionStatus === "pending" && <div>Submitting...</div>}
                {submissionStatus === "success" && <div>Success!</div>}
                {submissionStatus === "error" && <div>Error!</div>}
                <FormListener updateFacts={updateFacts} />
              </Grid>
            </Form>
          </div>
        )}
      </Formik>
    </div>
  );
};

export default CreateRelation;
