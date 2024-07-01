import * as React from "react";
import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { Button } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { baseFact } from "../baseFact";
import createMutation from "../validateAndSubmitDateFactMutation";

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
    const { date, collection } = values;

    const facts: any[] = [];

    //parse date
    const dateParts = date.split("/");
    if (dateParts.length === 3) {
      const year = dateParts[2];
      const month = dateParts[0];
      const day = dateParts[1];
      console.log(year, month, day);
      if (year.length === 4 && month.length === 2 && day.length === 2) {
        facts.push({
          ...baseFact,
          lh_object_uid: parseInt(year + month + day),
          lh_object_name: year + month + day,
          rel_type_uid: 1225,
          rel_type_name: "is classified as",
          rh_object_uid: 550571,
          rh_object_name: "date",
          collection_uid: collection.uid,
          collection_name: collection.name,
        });
      }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

const CreateDate = (props: any) => {
  const { handleOpen, handleClose, collection } = props;
  const initialValues = {
    date: formattedDate,
    collection: collection,
  };

  const [facts, setFacts] = React.useState([]);

  const updateFacts = (facts: any) => {
    setFacts(facts);
  };

  const mutation = useMutation(createMutation(facts));

  return (
    <div>
      <h3>Create Date</h3>
      <p style={{ color: "#555" }}>
        An unstructured sketch re: creating dates in the model
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
                    <Field name="date" type="text" />
                  </label>
                  <Grid container spacing={2}>
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

export default CreateDate;
