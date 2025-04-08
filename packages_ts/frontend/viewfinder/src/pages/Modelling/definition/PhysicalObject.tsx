import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";
//import './styles.css';
import Grid from "@mui/material/Grid";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { IconButton } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import createMutation from "../validateAndSubmitBinaryFactMutation";
import {
  SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
  SUBMIT_BINARY_FACTS_ENDPOINT,
} from "@relica/constants";
import { useStore } from "react-admin";

import { conjureDefinition } from "../../../io/CCBaseClient.js";

import SynonymAbbrvCode from "./SynonymAbbrvCode";
import MyAspectField from "./MyAspectField";
import FormListener from "./FormListener";
import MyField from "./MyField";
import KGEntityField from "../ui/KGEntityField";
import DefinitionField from "../ui/DefinitionField";

const Modelling = (props: any) => {
  const { handleOpen, handleClose, collection } = props;
  const initialValues = {
    uid: 1,
    languageUid: 910036,
    language: "English",
    languageCommunityUid: 6628,
    languageCommunity: "Relica",
    preferredName: "",
    synonyms: [],
    abbreviations: [],
    codes: [],
    supertype: {
      lh_object_uid: 1,
      lh_object_name: "concept",
    },
    aspects: [],
    intrinsicAspects: [],
    aspectQualifications: {},
    // aspect: {
    //   lh_object_uid: 1,
    //   lh_object_name: "concept",
    // },
    // aspectValue: {
    //   lh_object_uid: 1,
    //   lh_object_name: "concept",
    // },
    func: {
      lh_object_uid: null,
      lh_object_name: "concept",
    },
    definition: "",
    aspectValueUom: "",
    part: {
      lh_object_uid: null,
      lh_object_name: "concept",
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
    <div className="App">
      <h3>Physical Object Definition Model</h3>
      <p style={{ color: "#555" }}>
        This is a simple example of how to model a new concept in the knowledge
        graph.
      </p>
      <div>
        <small>
          <em>Instructions: tbd.</em>
        </small>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={5}>
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
                  <label>
                    uid
                    <Field name="uid" />
                  </label>
                  <br />
                  <label>
                    language
                    <Field name="language" />
                  </label>
                  <br />
                  <label>
                    language community
                    <MyField name="languageCommunity" />
                  </label>
                  <br />
                  <KGEntityField
                    name="supertype"
                    label="supertype"
                    handleOpen={handleOpen}
                    searchConeUID={730044}
                  />
                  <br />
                  <label>
                    preferred name
                    <MyField name="preferredName" />
                  </label>
                  <br />
                  <DefinitionField
                    name="definition"
                    label="textual definition"
                    termName="preferredName"
                    supertype="supertype"
                  />
                  <br />
                  <SynonymAbbrvCode
                    synonyms={values.synonyms}
                    abbreviations={values.abbreviations}
                    codes={values.codes}
                  />
                  <FieldArray name="aspects">
                    {({ push, remove }) => (
                      <div>
                        <h5>Discriminating aspects</h5>
                        {values.aspects.map((_: any, index: number) => (
                          <MyAspectField
                            name={`aspects.${index}`}
                            index={index}
                            handleOpen={handleOpen}
                            remove={remove}
                          />
                        ))}
                        <button type="button" onClick={() => push("")}>
                          +
                        </button>
                      </div>
                    )}
                  </FieldArray>
                  <br />
                  <KGEntityField
                    name="func"
                    label="discriminating function"
                    handleOpen={handleOpen}
                    searchConeUID={193671}
                  />
                  <KGEntityField
                    name="part"
                    label="obligatory part"
                    handleOpen={handleOpen}
                    searchConeUID={730044}
                  />
                  <button type="submit">Submit</button>
                  {submissionStatus === "pending" && <div>Submitting...</div>}
                  {submissionStatus === "success" && <div>Success!</div>}
                  {submissionStatus === "error" && <div>Error!</div>}
                  <FormListener updateFacts={updateFacts} />
                </Form>
              </div>
            )}
          </Formik>
        </Grid>
        <Grid item xs={7}>
          <Table rows={facts} />
        </Grid>
      </Grid>
      <div style={{ marginTop: 16 }}>
        Notice the following:
        <ul>
          <li>point a</li>
          <li>point b</li>
        </ul>
      </div>
    </div>
  );
};

export default Modelling;
