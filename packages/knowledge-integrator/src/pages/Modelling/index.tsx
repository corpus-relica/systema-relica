import React, { useState } from "react";
import { Formik, Form, Field, FieldArray, useFormikContext } from "formik";
import * as Yup from "yup";

import BasicInfoModule from "./definition/BasicInfoModule";
import Table from "./Table";

// Dynamic Form Component
const DynamicForm = () => {
  const [facts, setFacts] = useState([]);

  return (
    <>
      <Formik
        initialValues={{
          basicInfo: {
            preferredName: "",
            supertype: { lh_object_uid: "", lh_object_name: "" },
            definition: "",
          },
        }}
        validationSchema={Yup.object({
          basicInfo: Yup.object({
            preferredName: Yup.string().required("Required"),
            supertype: Yup.object({
              lh_object_uid: Yup.number().required("Required"),
              lh_object_name: Yup.string().required("Required"),
            }),
            definition: Yup.string().required("Required"),
          }),
          basicInfoTwo: Yup.object({
            preferredName: Yup.string().required("Required"),
            supertype: Yup.object({
              lh_object_uid: Yup.number().required("Required"),
              lh_object_name: Yup.string().required("Required"),
            }),
            definition: Yup.string().required("Required"),
          }),
        })}
        onSubmit={(values, actions) => {
          console.log(values);
          actions.setSubmitting(false);
        }}
      >
        {({ errors, touched }) => (
          <Form>
            <BasicInfoModule path="basicInfo" setFacts={setFacts} />
            <button type="submit">Submit</button>
            <pre>{JSON.stringify({ errors, touched }, null, 2)}</pre>
          </Form>
        )}
      </Formik>
      <Table rows={facts} />
    </>
  );
};

export default DynamicForm;
