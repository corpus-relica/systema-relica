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
    console.log(values);
    const {
      supertype,
      relationName,
      relationDefinition,
      requiredRole1,
      requiredRole2,
      collection,
    } = values;

    const facts = [];
    let definitiveFact = null;

    let definitiveUid = 1;
    let uid = definitiveUid;

    if (supertype && relationName && relationDefinition) {
      definitiveFact = facts.push({
        ...baseFact,
        lh_object_uid: uid.toString(),
        lh_object_name: relationName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: supertype.lh_object_uid.toString(),
        rh_object_name: supertype.lh_object_name,
        full_definition: relationDefinition,
        partial_definition: relationDefinition,
        collection_uid: collection.uid,
        collection_name: collection.name,
      });
      uid++;

      if (requiredRole1 && requiredRole2) {
        definitiveFact = facts.push({
          ...baseFact,
          lh_object_uid: definitiveUid.toString(),
          lh_object_name: relationName,
          rel_type_uid: "4731",
          rel_type_name: "requires a role-1 as a",
          rh_object_uid: requiredRole1.lh_object_uid.toString(),
          rh_object_name: requiredRole1.lh_object_name,
          collection_uid: collection.uid,
          collection_name: collection.name,
        });
        definitiveFact = facts.push({
          ...baseFact,
          lh_object_uid: definitiveUid.toString(),
          lh_object_name: relationName,
          rel_type_uid: "4733",
          rel_type_name: "requires a role-2 as a",
          rh_object_uid: requiredRole2.lh_object_uid.toString(),
          rh_object_name: requiredRole2.lh_object_name,
          collection_uid: collection.uid,
          collection_name: collection.name,
        });

        // else if (requiredRoles.length > 2) {
        //   requiredRoles.forEach((role: any) => {
        //     if (!role) return;
        //     facts.push({
        //       ...baseFact,
        //       lh_object_uid: role.lh_object_uid,
        //       lh_object_name: role.lh_object_name,
        //       rel_type_uid: "5343",
        //       rel_type_name: "can by definition have a role as a",
        //       rh_object_uid: definitiveUid,
        //       rh_object_name: roleName,
        //     });
        //     uid++;
        //   });
        // }
      }
    }

    updateFacts(facts);
  }, [values]);

  return null;
};

const CreateRelation = (props: any) => {
  const { handleOpen, handleClose, collection } = props;
  const initialValues = {
    relationName: "",
    relationDefinition: "",
    parent: {
      rh_object_uid: 0,
      rh_object_name: "",
    },
    requiredRole1: {},
    requiredRole2: {},
    collection: collection,
  };

  const [facts, setFacts] = React.useState([]);

  const updateFacts = (facts: any) => {
    setFacts(facts);
  };

  const mutation = useMutation(createMutation(facts));

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
                    subject="relation"
                    handleOpen={handleOpen}
                    setFieldValue={setFieldValue}
                    supertypeConeUID={RELATION_UID}
                  />
                  <br />
                  <label>
                    required role 1
                    <Field name="requiredRole1.lh_object_uid" type="text" />
                    <Field name="requiredRole1.lh_object_name" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("requiredRole1", setFieldValue, ROLE_UID); // "790229 - Role"
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
                  <label>
                    required role 2
                    <Field name="requiredRole2.lh_object_uid" type="text" />
                    <Field name="requiredRole2.lh_object_name" type="text" />
                    <IconButton
                      aria-label="search"
                      size="small"
                      onClick={() => {
                        handleOpen("requiredRole2", setFieldValue, ROLE_UID); // "790229 - Role"
                      }}
                    >
                      <SearchIcon fontSize="inherit" />
                    </IconButton>
                  </label>
                  <br />
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

export default CreateRelation;
