import React, { useState } from "react";
import { Box, Button, Form, FormField, TextInput, TextArea } from "grommet";
import FactTable from "./FactTable";
import { Fact } from "../types";
// import axiosInstance from "../axiosInstance";
import moment from "moment";
import {
  RLC_MEMO_TYPE_UID,
  RLC_MEMO_TITLE_TYPE_UID,
  RLC_MEMO_BODY_TYPE_UID,
} from "./RLCConstants";
//@ts-ignore
import {
  SUBMIT_BINARY_FACT_ENDPOINT,
  SUBMIT_BINARY_FACTS_ENDPOINT,
} from "@relica/constants";

const GAP = "small";

const RLCMemoForm: React.FC = () => {
  // const [isValidated, setIsValidated] = useState(false);
  const isValidated = true;
  const [refFactTableIsOpen, setRefFactTableIsOpen] = useState(false);
  const [refObjectUID, setRefObjectUID] = useState(null);
  const [refObjectName, setRefObjectName] = useState("");

  const setReferenceObject = (fact: Fact) => {
    setRefObjectUID(fact.lh_object_uid);
    setRefObjectName(fact.lh_object_name);
    setRefFactTableIsOpen(false);
  };

  const tpl = (
    memoId: string,
    rlcMemoTypeUID: number,
    rlcMemoTitleTypeUID: number,
    rlcMemoBodyTypeUID: number,
    refObjectUID: number,
    refObjectName: string,
    title: string,
    body: string,
  ) => `[
    [1,"memo_${memoId}","1225","is classified as a","${rlcMemoTypeUID}", "rlc_memo"],
    [2,"memo_title_${memoId}","1225","is classified as a","${rlcMemoTitleTypeUID}","rlc_memo_title", "${title}"],
    [3,"memo_body_${memoId}","1225","is classified as a","${rlcMemoBodyTypeUID}","rlc_memo_body", "${body}"],
    [2,"memo_title_${memoId}","1262","composition of an aspect",1,"memo_${memoId}"],
    [3,"memo_body_${memoId}","1262","composition of an aspect", 1,"memo_${memoId}"],
    [1,"memo_${memoId}","1770","reference to object by information","${refObjectUID}","${refObjectName}"]
  ]`;

  const escapeText = (input: string) => {
    let escapedInput = input
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return escapedInput;
  };
  const submit = async ({ title, body }: { title: string; body: string }) => {
    console.log("submit fact", { title, body, ref: refObjectName });
    const memoId = "" + Date.now();
    const rlcMemoTypeUID = RLC_MEMO_TYPE_UID;
    const rlcMemoTitleTypeUID = RLC_MEMO_TITLE_TYPE_UID;
    const rlcMemoBodyTypeUID = RLC_MEMO_BODY_TYPE_UID;
    const str = tpl(
      memoId,
      rlcMemoTypeUID,
      rlcMemoTitleTypeUID,
      rlcMemoBodyTypeUID,
      refObjectUID,
      refObjectName,
      escapeText(title),
      escapeText(body),
    );
    const protofacts = JSON.parse(str);
    const facts = protofacts.map((protofact: string[]) => {
      const baseObj: Fact = {
        lh_object_uid: parseInt(protofact[0]),
        lh_object_name: protofact[1],
        rel_type_uid: parseInt(protofact[2]),
        rel_type_name: protofact[3],
        rh_object_uid: parseInt(protofact[4]),
        rh_object_name: protofact[5],
        approval_status: "proposed",
        author: "Marc Christophe",
        effective_from: moment().format("DD/MM/YYYY"),
        language: "English",
        language_uid: 910036,
        latest_update: moment().format("DD/MM/YYYY"),
        reference: "Corpus Relica",
        //
        sequence: "",
        fact_uid: null,
        collection_uid: "",
        collection_name: "",
        lh_context_uid: null,
        lh_context_name: "",
        partial_definiton: "",
        full_definition: protofact[6] ? protofact[6] : "",
      };
      return baseObj;
    });
    // console.dir(facts);
    // const response = await axiosInstance.post(
    //   SUBMIT_BINARY_FACTS_ENDPOINT,
    //   facts
    // );
    // const { foo } = response.data;
    // console.log("SUBMIT RESPONSE", foo);
    // console.log("SUBMIT RESPONSE", response.data);
  };

  return (
    <>
      <Box gap={GAP}>
        <Box>New rlc_memo</Box>
        <Box>
          <Form
            onSubmit={({
              value,
            }: {
              value: { title: string; body: string };
            }) => {
              // if (isValidated) {
              submit(value);
              // } else {
              //   validate(value);
              // }
            }}
          >
            {/* TITLE */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField name="title" htmlFor="title-input" label="Title">
                <TextInput
                  id="title-input"
                  name="title"
                  placeholder="insert title here"
                />
              </FormField>
            </Box>
            {/* BODY */}
            <Box
              align="left"
              justify="start"
              direction="row"
              fill="horizontal"
              gap={GAP}
            >
              <FormField name="body" htmlFor="body-input" label="Body">
                <TextArea
                  id="body-input"
                  name="body"
                  placeholder="insert body here"
                />
              </FormField>
            </Box>
            {/* REF */}
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
                <Box direction="row" gap={GAP}>
                  {refObjectUID || "---"}::
                  {refObjectName || "No object selected"}
                </Box>
                <Button
                  label="Select an object for this memo to reference"
                  onClick={() => setRefFactTableIsOpen(true)}
                />
              </FormField>
            </Box>
            {/* SUBMIT BUTTON */}
            <Box border={true} direction="row" gap={GAP}>
              <Button
                type="submit"
                primary
                label={isValidated ? "Submit" : "Validate"}
              />{" "}
              <Button type="reset" label="Reset" />
            </Box>
          </Form>
        </Box>
      </Box>
      <FactTable
        factTableIsOpen={refFactTableIsOpen}
        setFactTableIsOpen={setRefFactTableIsOpen}
        callback={setReferenceObject}
      />
    </>
  );
};

export default RLCMemoForm;
