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
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { IconButton } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import { baseFact } from "../baseFact";
import createMutation from "../validateAndSubmitBinaryFactMutation";
import {
  SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
  SUBMIT_BINARY_FACTS_ENDPOINT,
} from "@relica/constants";
import { useStore } from "react-admin";

import axios from "axios";
import { conjureDefinition } from "../../../CCClient";

const OPEN_AI_API_KEY = "openai_api_key";
const ANTHROPIC_API_KEY = "anthropic_api_key";

const FormListener = ({ updateFacts }: { updateFacts: any }) => {
  const { values }: { values: any } = useFormikContext();

  React.useEffect(() => {
    // console.log("Form values changed:", values);
    // Perform any desired action when form values change
    const {
      uid,
      languageUid,
      language,
      languageCommunityUid,
      languageCommunity,
      preferredName,
      synonyms,
      abbreviations,
      codes,
      supertype,
      aspects,
      aspect,
      aspectValue,
      func,
      definition,
      aspectValueUom,
      part,
      aspectQualifications,
      collection,
    } = values;

    const facts = [];
    let definitiveFact = null;

    if (
      uid &&
      languageUid &&
      language &&
      languageCommunityUid &&
      languageCommunity &&
      preferredName &&
      supertype &&
      definition
    ) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: preferredName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: supertype.lh_object_uid.toString(),
        rh_object_name: supertype.lh_object_name,
        full_definition: "is a " + supertype.lh_object_name + " " + definition,
        partial_definition: definition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });

      // Synonyms
      //
      if (synonyms.length > 0) {
        // const terms = synonymAbbrvCode.split(",");
        synonyms.forEach((term: string) => {
          facts.push({
            ...baseFact,
            lh_object_uid: uid.toString(),
            lh_object_name: term,
            rel_type_uid: "1981",
            rel_type_name: "is a synonym of",
            rh_object_uid: uid.toString(),
            rh_object_name: preferredName,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
        });
      }

      // Abbreviations
      //
      if (abbreviations.length > 0) {
        // const terms = synonymAbbrvCode.split(",");
        abbreviations.forEach((term: string) => {
          facts.push({
            ...baseFact,
            lh_object_uid: uid.toString(),
            lh_object_name: term,
            rel_type_uid: "1982",
            rel_type_name: "is an abbreviation of",
            rh_object_uid: uid.toString(),
            rh_object_name: preferredName,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
        });
      }

      // Codes
      //
      if (codes.length > 0) {
        codes.forEach((term: string) => {
          facts.push({
            ...baseFact,
            lh_object_uid: uid.toString(),
            lh_object_name: term,
            rel_type_uid: "1983",
            rel_type_name: "is a code for",
            rh_object_uid: uid.toString(),
            rh_object_name: preferredName,
            collection_uid: collection.uid,
            collection_name: collection.name,
          });
        });
      }

      // Aspects
      //
      if (Array.isArray(aspects) && aspects.length > 0) {
        console.log("Mutherfucking aspect", aspects);
        aspects.forEach((aspect: any) => {
          // !!! inelegant; elswhere the value of aspect is being set to an empty string
          // when the actual field is blank, what we need to do is just not push anything into
          // the array at all in that case, avoid all these checks at the end of the journey
          if (aspect) {
            facts.push({
              ...baseFact,
              lh_object_uid: supertype.lh_object_uid.toString(),
              lh_object_name: supertype.lh_object_name,
              rel_type_uid: "5652",
              rel_type_name:
                "has subtypes that have as discriminating aspect a",
              rh_object_uid: aspect.lh_object_uid.toString(),
              rh_object_name: aspect.lh_object_name,
              collection_uid: collection.uid,
              collection_name: collection.name,
            });
            const quality = aspectQualifications[aspects[0].lh_object_uid];
            console.log("quality", quality);
            if (quality) {
              facts.push({
                ...baseFact,
                lh_object_uid: uid.toString(),
                lh_object_name: preferredName,
                rel_type_uid: "5283",
                rel_type_name: "is by definition qualified as",
                rh_object_uid: quality.lh_object_uid.toString(),
                rh_object_name: quality.lh_object_name,
                collection_uid: collection.uid,
                collection_name: collection.name,
              });
            }
          }
        });
      }

      // Function
      //
      if (func && func.lh_object_uid && func.lh_object_name) {
        // codes.forEach((term: string) => {
        facts.push({
          ...baseFact,
          lh_object_uid: uid.toString(),
          lh_object_name: preferredName,
          rel_type_uid: "4717",
          rel_type_name: "has as an intended function a",
          rh_object_uid: func.lh_object_uid.toString(),
          rh_object_name: func.lh_object_name,
          collection_uid: collection.uid,
          collection_name: collection.name,
        });
        // });
      }

      // Part
      //
      if (part && part.lh_object_uid && part.lh_object_name) {
        // codes.forEach((term: string) => {
        facts.push({
          ...baseFact,
          lh_object_uid: uid.toString(),
          lh_object_name: preferredName,
          rel_type_uid: "5519",
          rel_type_name: "is by definition a possible part of a",
          rh_object_uid: part.lh_object_uid.toString(),
          rh_object_name: part.lh_object_name,
          collection_uid: collection.uid,
          collection_name: collection.name,
        });
        // });
      }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

const MyField = (props: any) => {
  // const {
  //     values: { textA, textB },
  //     touched,
  //     setFieldValue,
  // } = useFormikContext();
  const [field, meta] = useField(props);

  // React.useEffect(() => {
  //     // set the value of textC, based on textA and textB
  //     if (
  //         textA.trim() !== "" &&
  //         textB.trim() !== "" &&
  //         touched.textA &&
  //         touched.textB
  //     ) {
  //         setFieldValue(props.name, `textA: ${textA}, textB: ${textB}`);
  //     }
  // }, [textB, textA, touched.textA, touched.textB, setFieldValue, props.name]);

  return (
    <>
      <Field {...props} {...field} value={field.value || ""} />
      {/*!!meta.touched && !!meta.error && <div>{meta.error}</div>*/}
    </>
  );
};

const MyAspectField = (props: any) => {
  const {
    //     values: { textA, textB },
    touched,
    setFieldValue,
  } = useFormikContext();
  const { handleOpen, remove, index } = props;
  const [field, meta] = useField(props);

  const [qualificationsUI, setQualificationsUI] = useState([]);
  const [selectedQual, setSelectedQual] = useState("");
  const [qux, setQux] = useState("");

  const handleChange = (event: SelectChangeEvent) => {
    console.log("val-->", event.target.value);
    console.log("QUX!!", qux);
    setFieldValue(
      `aspectQualifications.${field.value.lh_object_uid}`,
      qux[event.target.value]
    );
    setSelectedQual(event.target.value);
  };

  useEffect(() => {
    const fonk = async () => {
      if (field.value) {
        const foo = await axios.get(
          `http://localhost:3000/aspect/qualifications?uid=${field.value.lh_object_uid}`
        );
        console.log(foo);
        if (foo.data && foo.data.length > 0) {
          const quux = {};
          const qualifications = foo.data.map((f: any) => {
            quux[f.lh_object_uid] = f;
            return (
              <MenuItem value={f.lh_object_uid}>{f.lh_object_name}</MenuItem>
            );
          });
          setQux(quux);
          setQualificationsUI(
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedQual}
              label="Workflow"
              onChange={handleChange}
            >
              {...qualifications}
            </Select>
          );
        }
      }
    };
    console.log("FOOBARBAZ!!!");
    fonk();
  }, [field.value, selectedQual]);

  return (
    // <>
    //   <input {...props} {...field} value={field.value || ""} />
    //   {/*!!meta.touched && !!meta.error && <div>{meta.error}</div>*/}
    // </>

    <div key={index}>
      <label>
        uid
        <MyField
          name={`aspects.${index}.lh_object_uid`}
          onClick={() => {
            handleOpen(
              `aspects.${index}`,
              setFieldValue,
              790229 // "790229 - 160170" (substraction set operation)
            );
          }}
        />
      </label>
      <label>
        name
        <MyField
          name={`aspects.${index}.lh_object_name`}
          onClick={() => {
            handleOpen(
              `aspects.${index}`,
              setFieldValue,
              790229 // "790229 - 160170" (substraction set operation)
            );
          }}
        />
      </label>
      <br />
      {qualificationsUI}
      <button type="button" onClick={() => remove(index)}>
        -
      </button>
    </div>
  );
};

const Modelling = (props: any) => {
  const [openAIAPIKey, setOpenAIAPIKey] = useStore(OPEN_AI_API_KEY, null);
  const [anthropicAPIKey, setAnthropicAPIKey] = useStore(
    ANTHROPIC_API_KEY,
    null
  );

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
                  <label>
                    supertype concept uid
                    <MyField
                      name="supertype.lh_object_uid"
                      onClick={() => {
                        handleOpen("supertype", setFieldValue, 730044);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    supertype concept name
                    <MyField
                      name="supertype.lh_object_name"
                      onClick={() => {
                        handleOpen("supertype", setFieldValue, 730044);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    preferred name
                    <MyField name="preferredName" />
                  </label>
                  <br />
                  <label>
                    textual definition
                    {/*<MyField name="definition" multiline rows={4} />*/}
                    <MyField
                      name="definition"
                      as="textarea"
                      placeholder="Enter definition here"
                      multiLine
                      rows={4}
                      fullWidth
                    />
                    <IconButton
                      onClick={() => conjureDef(values, setFieldValue)}
                    >
                      <AutoAwesomeIcon />
                    </IconButton>
                  </label>
                  <br />
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <FieldArray name="synonyms">
                        {({ push, remove }) => (
                          <div>
                            <h5>synonyms</h5>
                            {values.synonyms.map((_: any, index: number) => (
                              <div key={index}>
                                <label>
                                  <MyField name={`synonyms.${index}`} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                >
                                  -
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => push("")}>
                              +
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </Grid>
                    <Grid item xs={4}>
                      <FieldArray name="abbreviations">
                        {({ push, remove }) => (
                          <div>
                            <h5>abbreviations</h5>
                            {values.abbreviations.map(
                              (_: any, index: number) => (
                                <div key={index}>
                                  <label>
                                    <MyField name={`abbreviations.${index}`} />
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
                    <Grid item xs={4}>
                      <FieldArray name="codes">
                        {({ push, remove }) => (
                          <div>
                            <h5>codes</h5>
                            {values.codes.map((_: any, index: number) => (
                              <div key={index}>
                                <label>
                                  <MyField name={`codes.${index}`} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                >
                                  -
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => push("")}>
                              +
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </Grid>
                  </Grid>
                  <br />

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
                  <label>
                    discriminating function uid
                    <MyField
                      name="func.lh_object_uid"
                      onClick={() => {
                        handleOpen("func", setFieldValue, 193671);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    discriminating function name
                    <MyField
                      name="func.lh_object_name"
                      onClick={() => {
                        handleOpen("func", setFieldValue, 193671);
                      }}
                    />
                  </label>
                  <br />
                  <br />
                  <label>
                    obligatory part uid
                    <MyField
                      name="part.lh_object_uid"
                      onClick={() => {
                        handleOpen("part", setFieldValue, 730044);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    obligatory part name
                    <MyField
                      name="part.lh_object_name"
                      onClick={() => {
                        handleOpen("part", setFieldValue, 730044);
                      }}
                    />
                    <br />
                    ...
                  </label>
                  <br />
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
