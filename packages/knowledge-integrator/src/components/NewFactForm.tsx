import React, { useState } from "react";
import { Box, Button, Form, FormField, Notification, TextInput } from "grommet";
import { Search } from "grommet-icons";
import FactTable from "./FactTable";
import moment from "moment";
import { Fact } from "../types";
// import {
//   SIMPLE_VALIDATE_BINARY_FACT_ENDPOINT,
//   SUBMIT_BINARY_FACT,
// } from "../constants";

const GAP = "small";

const NewFactForm = () => {
  const [lhObjectUID, setLHObjectUID] = React.useState(null);
  const [lhObjectName, setLHObjectName] = React.useState("");
  const [lhObjectFactTableIsOpen, setLHObjectFactTableIsOpen] = useState(false);

  const [relTypeUID, setRelTypeUID] = React.useState(null);
  const [relTypeName, setRelTypeName] = React.useState("");
  const [relTypeFactTableIsOpen, setRelTypeFactTableIsOpen] = useState(false);

  const [rhObjectUID, setRHObjectUID] = React.useState(null);
  const [rhObjectName, setRHObjectName] = React.useState("");
  const [rhObjectFactTableIsOpen, setRHObjectFactTableIsOpen] = useState(false);

  const [isValidated, setIsValidated] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const [submitStatus, setSubmitStatus] = useState("");
  const [submitStatusMessageOpen, setSubmitStatusMessageOpen] = useState(false);
  const [submitStatusMessage, setSubmitStatusMessage] = useState("");

  const [validCtxUID, setValidCtxUID] = React.useState(null);
  const [validCtxName, setValidCtxName] = React.useState("");
  const [validCtxFactTableIsOpen, setValidCtxFactTableIsOpen] = useState(false);

  const invalidate = () => {
    setIsValidated(false);
    setValidationMessage("");
  };

  const validate = (fact: Fact) => {
    console.log(fact);
    // axiosInstance
    //   .get(SIMPLE_VALIDATE_BINARY_FACT_ENDPOINT, { params: fact })
    //   .then((response) => {
    //     const { isValid, message } = response.data;
    //     setIsValidated(isValid);
    //     setValidationMessage(message || "");
    //   })
    //   .catch((error) => {
    //     console.error("Error:", error);
    //   });
  };

  const submit = async (newFact: Fact) => {
    // const response = await axiosInstance.post(SUBMIT_BINARY_FACT, newFact);
    // const { success, fact, message } = response.data;
    // setSubmitStatus(success);
    // if (success) {
    //   setSubmitStatusMessage(
    //     `Fact ${fact.fact_uid}:
    // ${fact.lh_object_uid} :: ${fact.rel_type_uid} :: ${fact.rh_object_uid}
    // ${fact.lh_object_name} :: ${fact.rel_type_name} :: ${fact.rh_object_name}
    // submitted successfully!`
    //   );
    // } else {
    //   setSubmitStatusMessage(message);
    // }
    // setSubmitStatusMessageOpen(true);
  };

  const setLHObject = (fact: Fact) => {
    setLHObjectUID(fact.lh_object_uid);
    setLHObjectName(fact.lh_object_name);
    setLHObjectFactTableIsOpen(false);
  };

  const setRelType = (fact: Fact) => {
    setRelTypeUID(fact.lh_object_uid);
    setRelTypeName(fact.lh_object_name);
    setRelTypeFactTableIsOpen(false);
  };

  const setRHObject = (fact: Fact) => {
    setRHObjectUID(fact.lh_object_uid);
    setRHObjectName(fact.lh_object_name);
    setRHObjectFactTableIsOpen(false);
  };

  const setValidCtx = (fact: Fact) => {
    setValidCtxUID(fact.lh_object_uid);
    setValidCtxName(fact.lh_object_name);
    setValidCtxFactTableIsOpen(false);
  };

  const reset = () => {
    setLHObjectUID("");
    setLHObjectName("");

    setRelTypeUID("");
    setRelTypeName("");

    setRHObjectUID("");
    setRHObjectName("");

    setValidCtxUID("");
    setValidCtxName("");

    resetToast();
  };

  const resetToast = () => {
    setSubmitStatus("normal");
    setSubmitStatusMessage("");
    setSubmitStatusMessageOpen(false);
  };

  return (
    <>
      <Box gap={GAP}>
        <Box>New Fact</Box>
        <Box>
          <Form
            onSubmit={({ value }: { value: Fact }) => {
              if (isValidated) {
                submit(value);
              } else {
                validate(value);
              }
            }}
            onReset={reset}
          >
            {/* LANGUAGE UID */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
              border={true}
            >
              <FormField
                name="language-uid"
                htmlFor="language-uid-input"
                label="Language UID"
              >
                <TextInput
                  id="language-uid-input"
                  name="language_uid"
                  value="910036"
                  disabled={true}
                />
              </FormField>
              {/* LANGUAGE  */}
              <FormField
                name="language"
                htmlFor="language-input"
                label="Language"
              >
                <TextInput
                  id="language-input"
                  name="language"
                  value="English"
                  disabled={true}
                />
              </FormField>
            </Box>

            {/* LH OBJECT UID */}
            {/* LH OBJECT NAME */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField
                name="lh-object-uid"
                htmlFor="lh-object-uid-input"
                label="Left-Hand Object UID"
              >
                <TextInput
                  id="lh-object-uid-input"
                  name="lh_object_uid"
                  value={lhObjectUID}
                  onChange={(e) => {
                    invalidate();
                    setLHObjectUID(e.target.value);
                  }}
                />
              </FormField>
              <FormField
                name="lh-object-name"
                htmlFor="lh-object-name-input"
                label="Left-Hand Object Name"
              >
                <TextInput
                  id="lh-object-name-input"
                  name="lh_object_name"
                  value={lhObjectName}
                  onChange={(e) => {
                    invalidate();
                    setLHObjectName(e.target.value);
                  }}
                />
              </FormField>
              <Button
                label=""
                icon={<Search />}
                onClick={() => {
                  setLHObjectFactTableIsOpen(true);
                }}
              />
            </Box>

            {/* REL TYPE UID */}
            {/* REL TYPE NAME */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField
                name="rel-type-uid"
                htmlFor="rel-type-uid-input"
                label="Relation Type UID"
              >
                <TextInput
                  id="rel-type-uid-input"
                  name="rel_type_uid"
                  value={relTypeUID}
                  onChange={(e) => {
                    invalidate();
                    setRelTypeUID(e.target.value);
                  }}
                />
              </FormField>
              <FormField
                name="rel-type-name"
                htmlFor="rel-type-name-input"
                label="Relation Type Name"
              >
                <TextInput
                  id="rel-type-name-input"
                  name="rel_type_name"
                  value={relTypeName}
                  onChange={(e) => {
                    invalidate();
                    setRelTypeName(e.target.value);
                  }}
                />
              </FormField>
              <Button
                label=""
                icon={<Search />}
                onClick={() => {
                  setRelTypeFactTableIsOpen(true);
                }}
              />
            </Box>

            {/* RH OBJECT UID */}
            {/* RH OBJECT NAME */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField
                name="rh-object-uid"
                htmlFor="rh-object-uid-input"
                label="Right-Hand Object UID"
              >
                <TextInput
                  id="rh-object-uid-input"
                  name="rh_object_uid"
                  value={rhObjectUID}
                  onChange={(e) => {
                    invalidate();
                    setRHObjectUID(e.target.value);
                  }}
                />
              </FormField>
              <FormField
                name="rh-object-name"
                htmlFor="rh-object-name-input"
                label="Right-Hand Object Name"
              >
                <TextInput
                  id="rh-object-name-input"
                  name="rh_object_name"
                  value={rhObjectName}
                  onChange={(e) => {
                    invalidate();
                    setRHObjectName(e.target.value);
                  }}
                />
              </FormField>
              <Button
                label=""
                icon={<Search />}
                onClick={() => {
                  setRHObjectFactTableIsOpen(true);
                }}
              />
            </Box>
            {/* APPROVAL STATUS */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField
                name="approval-status"
                htmlFor="approval-status-input"
                label="Approval Status"
              >
                <TextInput
                  id="approval-status-input"
                  name="approval_status"
                  value="proposed"
                  disabled={true}
                />
              </FormField>
            </Box>
            {/* DATES */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField
                name="effective-from"
                htmlFor="effective-from-input"
                label="Effective From"
              >
                <TextInput
                  id="effective-from-input"
                  name="effective_from"
                  value={moment().format("MM/DD/YYYY")}
                  disabled={true}
                />
              </FormField>
              <FormField
                name="last-update"
                htmlFor="last-update-input"
                label="Last Update"
              >
                <TextInput
                  id="last-update-input"
                  name="last_update"
                  value={moment().format("MM/DD/YYYY")}
                  disabled={true}
                />
              </FormField>
            </Box>
            {/* AUTHOR */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField name="author" htmlFor="author-input" label="Author">
                <TextInput
                  id="author-input"
                  name="author"
                  value="Marc Christophe"
                  disabled={true}
                />
              </FormField>
            </Box>
            {/* Reference */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField
                name="reference"
                htmlFor="reference-input"
                label="Reference"
              >
                <TextInput
                  id="reference-input"
                  name="reference"
                  value="Corpus Relica"
                  disabled={true}
                />
              </FormField>
            </Box>
            {/* VALIDITY CONTEXT UID */}
            {/* VALIDITY CONTEXT NAME */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField
                name="valid-ctx-uid"
                htmlFor="valid-ctx-uid-input"
                label="Validity Context UID"
              >
                <TextInput
                  id="valid-ctx-uid-input"
                  name="valid_ctx_uid"
                  value={validCtxUID}
                  onChange={(e) => {
                    invalidate();
                    setValidCtxUID(e.target.value);
                  }}
                />
              </FormField>
              <FormField
                name="valid-ctx-name"
                htmlFor="valid-ctx-name-input"
                label="Validity Context Name"
              >
                <TextInput
                  id="valid-ctx-name-input"
                  name="valid_ctx_name"
                  value={validCtxName}
                  onChange={(e) => {
                    invalidate();
                    setValidCtxName(e.target.value);
                  }}
                />
              </FormField>
              <Button
                label=""
                icon={<Search />}
                onClick={() => {
                  setValidCtxFactTableIsOpen(true);
                }}
              />
            </Box>

            <Box border={true} direction="row" gap={GAP}>
              <Button
                type="submit"
                primary
                label={isValidated ? "Submit" : "Validate"}
              />
              <Button type="reset" label="Reset" />
            </Box>
          </Form>
        </Box>
        <Box>{validationMessage}</Box>
      </Box>
      <FactTable
        factTableIsOpen={lhObjectFactTableIsOpen}
        setFactTableIsOpen={setLHObjectFactTableIsOpen}
        callback={setLHObject}
      />
      <FactTable
        factTableIsOpen={relTypeFactTableIsOpen}
        setFactTableIsOpen={setRelTypeFactTableIsOpen}
        callback={setRelType}
      />
      <FactTable
        factTableIsOpen={rhObjectFactTableIsOpen}
        setFactTableIsOpen={setRHObjectFactTableIsOpen}
        callback={setRHObject}
      />
      <FactTable
        factTableIsOpen={validCtxFactTableIsOpen}
        setFactTableIsOpen={setValidCtxFactTableIsOpen}
        callback={setValidCtx}
      />
      {submitStatusMessageOpen && (
        <Box border={true}>
          <Notification
            actions={[
              { label: "Renew Subscription", href: "/renew" },
              { label: "View Details", href: "/details" },
            ]}
            toast={{ autoClose: false }}
            status={submitStatus ? "normal" : "critical"}
            title="Fact Submission Status"
            message={<Box width={"100%"}>{submitStatusMessage}</Box>}
            onClose={resetToast}
          />
        </Box>
      )}
    </>
  );
};

export default NewFactForm;
