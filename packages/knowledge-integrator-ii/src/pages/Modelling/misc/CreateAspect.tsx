import * as React from "react";
import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { Button } from "@mui/material";
import Table from "../Table";
import { useMutation } from "@tanstack/react-query";
import {
  SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
  SUMBIT_BINARY_FACTS_ENDPOINT,
} from "@relica/constants";
import axios from "axios";
import { baseFact } from "../baseFact";

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
    const { supertype, aspectName, aspectDefinition, qualifications } = values;

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
  const { handleOpen, handleClose } = props;
  const initialValues = {
    aspectName: "",
    aspectDefinition: "",
    parent: {
      rh_object_uid: 0,
      rh_object_name: "",
    },
    qualifications: [],
  };

  const [facts, setFacts] = React.useState([]);

  const updateFacts = (facts: any) => {
    setFacts(facts);
  };

  const mutation = useMutation({
    mutationFn: (facts: any[]) => {
      // i will iterate over the facts and convert certain fields to numbers
      // before sending them to the server
      const foo = facts.map((fact) => {
        return {
          ...fact,
          lh_object_uid: parseInt(fact.lh_object_uid),
          fact_uid: parseInt(fact.fact_uid),
          rel_type_uid: parseInt(fact.rel_type_uid),
          rh_object_uid: parseInt(fact.rh_object_uid),
          uom_uid: parseInt(fact.uom_uid),
        };
      });

      return axios.post(
        "http://localhost:3000" + SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
        foo
      );
    },
    onSuccess: (data, variables, context) => {
      const success = data.data.reduce((acc: boolean, result: any) => {
        return acc && result.isValid;
      }, true);

      if (!success) {
        console.error("ERROR", data.data);
      } else {
        console.log("SUCCESS", success);
        //submit the facts

        const foo = facts.map((fact) => {
          return {
            ...fact,
            lh_object_uid: parseInt(fact.lh_object_uid),
            fact_uid: parseInt(fact.fact_uid),
            rel_type_uid: parseInt(fact.rel_type_uid),
            rh_object_uid: parseInt(fact.rh_object_uid),
            uom_uid: parseInt(fact.uom_uid),
          };
        });
        const result = axios.post(
          "http://localhost:3000" + SUMBIT_BINARY_FACTS_ENDPOINT,
          foo
        );
        console.log("RESULT", result);
      }

      console.log("SUCCESS", success);
    },
  });

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
                  <label>
                    supertype-uid
                    <Field name="supertype.lh_object_uid" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("supertype", setFieldValue, 790229); // "790229 - Role"
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
                  <label>
                    supertype-name
                    <Field name="supertype.lh_object_name" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("supertype", setFieldValue, 790229); // "790229 - Role"
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
                  <label>
                    new aspect name
                    <Field name="aspectName" type="" />
                  </label>
                  <br />
                  <label>
                    aspect definition
                    <Field name="aspectDefinition" type="text" />
                  </label>
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
