import React from "react";
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
import Table from "../Table";

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
        lh_object_uid: uid,
        lh_object_name: preferredName,
        rel_type_uid: 1146,
        rel_type_name: "is a specialization of",
        rh_object_uid: supertype.lh_object_uid,
        rh_object_name: supertype.lh_object_name,
      });

      // Synonyms
      //
      if (synonyms.length > 0) {
        // const terms = synonymAbbrvCode.split(",");
        synonyms.forEach((term: string) => {
          facts.push({
            lh_object_uid: uid,
            lh_object_name: term,
            rel_type_uid: 1981,
            rel_type_name: "is a synonym of",
            rh_object_uid: uid,
            rh_object_name: preferredName,
          });
        });
      }

      // Abbreviations
      //
      if (abbreviations.length > 0) {
        // const terms = synonymAbbrvCode.split(",");
        abbreviations.forEach((term: string) => {
          facts.push({
            lh_object_uid: uid,
            lh_object_name: term,
            rel_type_uid: 1982,
            rel_type_name: "is an abbreviation of",
            rh_object_uid: uid,
            rh_object_name: preferredName,
          });
        });
      }

      // Codes
      //
      if (codes.length > 0) {
        codes.forEach((term: string) => {
          facts.push({
            lh_object_uid: uid,
            lh_object_name: term,
            rel_type_uid: 1983,
            rel_type_name: "is a code for",
            rh_object_uid: uid,
            rh_object_name: preferredName,
          });
        });
      }

      // Aspects
      //
      if (aspects.length > 0) {
        aspects.forEach((aspect: any) => {
          facts.push({
            lh_object_uid: supertype.lh_object_uid,
            lh_object_name: supertype.lh_object_name,
            rel_type_uid: 5652,
            rel_type_name: "has subtypes that have as discriminating aspect a",
            rh_object_uid: aspect.lh_object_uid,
            rh_object_name: aspect.lh_object_name,
          });
          facts.push({
            lh_object_uid: uid,
            lh_object_name: preferredName,
            rel_type_uid: 5283,
            rel_type_name: "is by definition qualified as",
            rh_object_uid: aspect.lh_object_uid,
            rh_object_name: aspect.lh_object_name,
          });
        });
      }

      // Aspect
      //
      if (aspect) {
        facts.push({
          lh_object_uid: supertype.lh_object_uid,
          lh_object_name: supertype.lh_object_name,
          rel_type_uid: 5652,
          rel_type_name: "has subtypes that have as discriminating aspect a",
          rh_object_uid: aspect.lh_object_uid,
          rh_object_name: aspect.lh_object_name,
        });
        facts.push({
          lh_object_uid: uid,
          lh_object_name: preferredName,
          rel_type_uid: 5283,
          rel_type_name: "is by definition qualified as",
          rh_object_uid: aspect.lh_object_uid,
          rh_object_name: aspect.lh_object_name,
        });
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
      <input {...props} {...field} value={field.value || ""} />
      {/*!!meta.touched && !!meta.error && <div>{meta.error}</div>*/}
    </>
  );
};

const Modelling = (props: any) => {
  const { handleOpen, handleClose } = props;
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
    aspect: {
      lh_object_uid: 1,
      lh_object_name: "concept",
    },
    aspectValue: {
      lh_object_uid: 1,
      lh_object_name: "concept",
    },
    func: {
      lh_object_uid: 1,
      lh_object_name: "concept",
    },
    definition: "",
    aspectValueUom: "",
    part: {
      lh_object_uid: 1,
      lh_object_name: "concept",
    },
  };

  const [facts, setFacts] = React.useState([]);

  const updateFacts = (facts: any) => {
    setFacts(facts);
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
            onSubmit={async (v) => alert(JSON.stringify(v, null, 2))}
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
                    preferred name
                    <MyField name="preferredName" />
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
                    textual definition
                    <MyField name="definition" />
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
                  <label>
                    discriminating function uid
                    <MyField
                      name="func.lh_object_uid"
                      onClick={() => {
                        handleOpen("func", setFieldValue);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    discriminating function name
                    <MyField
                      name="func.lh_object_name"
                      onClick={() => {
                        handleOpen("func", setFieldValue);
                      }}
                    />
                  </label>
                  <br />

                  <FieldArray name="aspects">
                    {({ push, remove }) => (
                      <div>
                        <h5>Discriminating aspects</h5>
                        {values.aspects.map((_: any, index: number) => (
                          <div key={index}>
                            <label>
                              uid
                              <MyField
                                name={`aspects.${index}.lh_object_uid`}
                                onClick={() => {
                                  handleOpen(
                                    `aspects.${index}`,
                                    setFieldValue,
                                    790229 // "790229 - 160170" (a set operation)
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
                                    790229 // "790229 - 160170" (a set operation)
                                  );
                                }}
                              />
                            </label>
                            <button type="button" onClick={() => remove(index)}>
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

                  {/*<label>
                    discriminating aspect uid
                    <MyField
                      name="aspect.lh_object_uid"
                      onClick={() => {
                        handleOpen("aspect", setFieldValue);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    discriminating aspect name
                    <MyField
                      name="aspect.lh_object_name"
                      onClick={() => {
                        handleOpen("aspect", setFieldValue);
                      }}
                    />
                  </label>*/}
                  <br />
                  <label>
                    discriminating aspect value uid
                    <MyField
                      name="aspectValue.lh_object_uid"
                      onClick={() => {
                        handleOpen("aspect-value", setFieldValue);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    discriminating aspect value name/number
                    <MyField
                      name="aspectValue.lh_object_name"
                      onClick={() => {
                        handleOpen("aspect-value", setFieldValue);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    discriminating aspect value unit of measure
                    <MyField name="aspectValueUom" />
                    <br />
                    ...
                  </label>
                  <br />
                  <label>
                    obligatory part uid
                    <MyField
                      name="part.lh_object_uid"
                      onClick={() => {
                        handleOpen("part", setFieldValue);
                      }}
                    />
                  </label>
                  <br />
                  <label>
                    obligatory part name
                    <MyField
                      name="part.lh_object_name"
                      onClick={() => {
                        handleOpen("part", setFieldValue);
                      }}
                    />
                    <br />
                    ...
                  </label>
                  <br />
                  <button type="submit">Submit</button>
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
