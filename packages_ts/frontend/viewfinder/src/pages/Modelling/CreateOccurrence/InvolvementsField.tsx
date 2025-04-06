import React from "react";
import {
  Formik,
  Field,
  Form,
  useField,
  useFormikContext,
  FieldArray,
} from "formik";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import KGEntityField from "../ui/KGEntityField";
import DefinitionField from "../ui/DefinitionField";

const INVOLVEMENT_UID = 4767;
const INVOLVER_UID = 4773;
const INVOLVED_UID = 4546;

const InvolvementDef = (props: any) => {
  const { index, handleOpen, setFieldValue, supertypeConeUID } = props;

  return (
    <>
      <KGEntityField
        name={`involvements.${index}.supertype`}
        label="supertype"
        handleOpen={handleOpen}
        supertypeConeUID={supertypeConeUID}
      />
      <label>
        new involvement name
        <Field name={`involvements.${index}.name`} type="" />
      </label>
      <br />
      <DefinitionField
        name={`involvements.${index}.definition`}
        label="involvement definition"
        termName={`involvements.${index}.name`}
        supertype={`involvements.${index}.supertype`}
      />
      <br />
      <label>
        involvement required role 1
        <Field
          name={`involvements.${index}.requiredRole1.lh_object_uid`}
          type="text"
        />
        <Field
          name={`involvements.${index}.requiredRole1.lh_object_name`}
          type="text"
        />
        <IconButton
          aria-label="search"
          size="small"
          onClick={() => {
            handleOpen(
              `involvements.${index}.requiredRole1`,
              setFieldValue,
              INVOLVED_UID
            );
          }}
        >
          <SearchIcon fontSize="inherit" />
        </IconButton>
      </label>
      <br />
      <label>
        involvement required role 2
        <Field
          name={`involvements.${index}.requiredRole2.lh_object_uid`}
          type="text"
        />
        <Field
          name={`involvements.${index}.requiredRole2.lh_object_name`}
          type="text"
        />
        <IconButton
          aria-label="search"
          size="small"
          onClick={() => {
            handleOpen(
              `involvements.${index}.requiredRole2`,
              setFieldValue,
              INVOLVER_UID
            );
          }}
        >
          <SearchIcon fontSize="inherit" />
        </IconButton>
      </label>
    </>
  );
};

const InvolvementsField = (props) => {
  const { handleOpen } = props;
  const { values, setFieldValue } = useFormikContext();

  return (
    <FieldArray name="involvements">
      {({ push, remove }) => (
        <div>
          <h5>Involvement</h5>
          {values.involvements.map((_: any, index: number) => (
            <div key={index}>
              <label>
                <InvolvementDef
                  index={index}
                  handleOpen={handleOpen}
                  setFieldValue={setFieldValue}
                  supertypeConeUID={INVOLVEMENT_UID}
                />
              </label>
              <button type="button" onClick={() => remove(index)}>
                -
              </button>
            </div>
          ))}
          <button type="button" onClick={() => push({})}>
            +
          </button>
        </div>
      )}
    </FieldArray>
  );
};
export default InvolvementsField;
