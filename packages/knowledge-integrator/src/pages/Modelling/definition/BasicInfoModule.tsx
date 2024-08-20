import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray, useFormikContext } from "formik";
import * as Yup from "yup";
import useDynamicForm from "./useDynamicForm";
import BasicInfoModuleTwo from "./BasicInfoModuleTwo";

const BasicInfoModule = ({ path = "basicInfo", setFacts }) => {
  const [childFacts, setChildFacts] = useState([]);

  const updateFacts = (facts) => {
    const generatedFacts = generateFacts();
    setChildFacts(facts);
    setFacts([...facts, ...generatedFacts]);
  };

  const { getValue, setValue, getError, getTouched, setError } =
    useDynamicForm(path);

  const generateFacts = () => {
    const preferredName = getValue("preferredName");
    const supertypeName = getValue("supertype.lh_object_name");
    const supertypeUID = getValue("supertype.lh_object_uid");
    const definition = getValue("definition");

    return [
      {
        fact_uid: "1",
        lh_object_uid: "1",
        lh_object_name: preferredName,
        rel_type_uid: "1146",
        rel_type_name: "is a specialization of",
        rh_object_uid: supertypeUID,
        rh_object_name: supertypeName,
        full_definition: definition,
        partial_definition: definition,
      },
    ];
  };

  useEffect(() => {
    const preferredName = getValue("preferredName");
    const supertypeName = getValue("supertype.lh_object_name");

    if (preferredName && supertypeName && preferredName === supertypeName) {
      setError(
        "preferredName",
        "Preferred name cannot be the same as supertype name"
      );
    } else {
      setError("preferredName", undefined);
      const facts = generateFacts();
      setFacts([...childFacts, ...facts]);
    }
  }, [
    getValue("preferredName"),
    getValue("supertype.lh_object_name"),
    getValue("supertype.lh_object_uid"),
    getValue("definition"),
    setError,
  ]);

  return (
    <div>
      <div>
        <label htmlFor={`${path}.preferredName`}>Preferred Name</label>
        <Field name={`${path}.preferredName`} />
        {getError("preferredName") && getTouched("preferredName") && (
          <div style={{ color: "red" }}>{getError("preferredName")}</div>
        )}
      </div>

      <div>
        <label htmlFor={`${path}.supertype.lh_object_uid`}>Supertype UID</label>
        <Field name={`${path}.supertype.lh_object_uid`} />
        {getError("supertype.lh_object_uid") &&
          getTouched("supertype.lh_object_uid") && (
            <div style={{ color: "red" }}>
              {getError("supertype.lh_object_uid")}
            </div>
          )}
      </div>

      <div>
        <label htmlFor={`${path}.supertype.lh_object_name`}>
          Supertype Name
        </label>
        <Field name={`${path}.supertype.lh_object_name`} />
        {getError("supertype.lh_object_name") &&
          getTouched("supertype.lh_object_name") && (
            <div style={{ color: "red" }}>
              {getError("supertype.lh_object_name")}
            </div>
          )}
      </div>

      <div>
        <label htmlFor={`${path}.definition`}>Definition</label>
        <Field name={`${path}.definition`} as="textarea" />
        {getError("definition") && getTouched("definition") && (
          <div style={{ color: "red" }}>{getError("definition")}</div>
        )}
      </div>
      <Form>
        <BasicInfoModuleTwo path="basicInfoTwo" setFacts={updateFacts} />
      </Form>
    </div>
  );
};

export default BasicInfoModule;
