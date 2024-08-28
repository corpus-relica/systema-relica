import * as React from "react";
import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { Button } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { baseFact } from "../baseFact";
import createMutation from "../validateAndSubmitBinaryFactMutation";

import DefinitionField from "../ui/DefinitionField";

import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";

const ANYTHING_UID = 730000;
const RELATION_UID = 2850;
const ROLE_UID = 160170;
const PHYSICAL_OBJECT_UID = 730044;

const date = new Date();
const formattedDate = date.toISOString().slice(0, 10);

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    const { name, definition, kind, collection } = values;

    const facts: any[] = [];

    if (kind.lh_object_uid && kind.lh_object_name && name) {
      facts.push({
        ...baseFact,
        lh_object_uid: "1",
        lh_object_name: name,
        rel_type_uid: "1225",
        rel_type_name: "is classified as",
        rh_object_uid: kind.lh_object_uid.toString(),
        rh_object_name: kind.lh_object_name,
        full_definition: `is a ${kind.lh_object_name} ${definition}`,
        partial_definition: definition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

const ClassifyIndividual = (props: any) => {
  const { handleOpen, handleClose, collection } = props;
  const initialValues = {
    kind: {
      lh_object_uid: null,
      lh_object_name: "",
    },
    name: "",
    definition: "",
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
      <h3>Classify Individual</h3>
      <p style={{ color: "#555" }}>
        An unstructured sketch re: creating individuals from kinds in the model
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
            onSubmit={(values) => mutation.mutate(facts)}
          >
            {({ setFieldValue, values }) => (
              <div className="section">
                <Form>
                  <label>
                    Kind
                    <Field name="kind.lh_object_uid" type="text" />
                    <Field name="kind.lh_object_name" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("kind", setFieldValue, ANYTHING_UID);
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
                  <label>
                    new individual name
                    <Field name="name" type="" />
                  </label>
                  <br />
                  <DefinitionField
                    name="definition"
                    label="individual definition"
                    termName="name"
                    supertype="kind"
                  />

                  <br />
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
                </Form>
              </div>
            )}
          </Formik>
        </Grid>
      </Grid>
    </div>
  );
};

export default ClassifyIndividual;
