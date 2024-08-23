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

import FormListener from "./FormListener";
import RolePlayersField from "./RolePlayersField";
import RequiringRelationsField from "./RequiringRelationsField";

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
    definitiveRolePlayers: [],
    possibleRolePlayers: [],
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
                    <RolePlayersField {...props} />
                    <RequiringRelationsField {...props} />
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
