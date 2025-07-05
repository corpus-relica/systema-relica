import * as React from "react";
import Grid from "@mui/material/Grid";
import { Search as SearchIcon } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import { Button } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { baseFact } from "../baseFact";
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

const date = new Date();
const formattedDate = date.toISOString().slice(0, 10);

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    const { lh_object, rel_type, rh_object, collection } = values;

    const facts = [];

    if (
      lh_object.lh_object_uid &&
      lh_object.lh_object_name &&
      rel_type.lh_object_uid &&
      rel_type.lh_object_name &&
      rh_object.lh_object_uid &&
      rh_object.lh_object_name
    ) {
      facts.push({
        ...baseFact,
        lh_object_uid: lh_object.lh_object_uid.toString(),
        lh_object_name: lh_object.lh_object_name,
        rel_type_uid: rel_type.lh_object_uid,
        rel_type_name: rel_type.lh_object_name,
        rh_object_uid: rh_object.lh_object_uid.toString(),
        rh_object_name: rh_object.lh_object_name,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

const CreateBinaryFact = (props: any) => {
  const { handleOpen, handleClose, collection } = props;
  const initialValues = {
    lh_object: {
      lh_object_uid: undefined,
      lh_object_name: "",
    },
    rel_type: {
      lh_object_uid: undefined,
      lh_object_name: "",
    },
    rh_object: {
      lh_object_uid: undefined,
      lh_object_name: "",
    },
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
      <h3>Binary Fact</h3>
      <p style={{ color: "#555" }}>
        An unstructured sketch re: creating binary facts
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
                    left hand object
                    <Field name="lh_object.lh_object_uid" type="text" />
                    <Field name="lh_object.lh_object_name" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("lh_object", setFieldValue, 730000); // "730000 - Anything"
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
                  <label>
                    rel type
                    <Field name="rel_type.lh_object_uid" type="text" />
                    <Field name="rel_type.lh_object_name" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("rel_type", setFieldValue, 2850); // "2850 - Relation"
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
                  <label>
                    right hand object
                    <Field name="rh_object.lh_object_uid" type="text" />
                    <Field name="rh_object.lh_object_name" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("rh_object", setFieldValue, 730000); // "730000 - Anything"
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
                  <Button type="submit">Submit</Button>
                  {submissionStatus === "pending" && <div>Submitting...</div>}
                  {submissionStatus === "success" && <div>Success!</div>}
                  {submissionStatus === "error" && <div>Error!</div>}
                  <FormListener updateFacts={updateFacts} />
                </Form>
                <br />
                <Table rows={facts} height={250} />
              </div>
            )}
          </Formik>
        </Grid>
      </Grid>
    </div>
  );
};

export default CreateBinaryFact;
