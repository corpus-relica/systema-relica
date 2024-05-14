import React, { useState } from "react";
import { Box, Button, Form, FormField, Notification, TextInput } from "grommet";
import { Search } from "grommet-icons";
import { Fact } from "../../types";
import { uidSearch } from "../../RLCBaseClient";
import { Iteration, Cloud, StatusUnknown, MoreVertical } from "grommet-icons";

import FactTable from "../FactTable";

const GAP = "small";
const SIZE = "xsmall";

const ConceptIdentifier = (props) => {
  const { name, onUpdate } = props;
  const [fact, setFact] = useState<Fact | null>(null);
  const [objectType, setObjectType] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [objectUID, setObjectUID] = useState(null);
  const [objectName, setObjectName] = useState("");
  const [factTableIsOpen, setFactTableIsOpen] = useState(false);

  const invalidate = () => {
    setObjectType("");
    setSuggestions([]);
    setFact(null);
    setObjectUID("");
    setObjectName("");
  };

  const invalidateName = () => {
    setObjectType("");
    setSuggestions([]);
    setFact(null);
    setObjectName("");
  };

  const doUIDSearch = async (uid: string) => {
    const foo = parseInt(uid);
    const facts = await uidSearch(foo);
    if (facts.length > 0) {
      establishFact(facts[0]);
      setSuggestions(
        facts.map((f) => {
          return { label: f.lh_object_name, value: f };
        }),
      );
    } else {
      invalidateName();
    }
  };

  const establishFact = (fact: Fact) => {
    setFact(fact);
    setObjectUID(fact.lh_object_uid);
    setObjectName(fact.lh_object_name);
    onUpdate(fact);
    console.log(fact.rel_type_uid);
    const type = fact.rel_type_uid;
    if (type === 1146 || type === 1981) {
      setObjectType("kind");
    } else if (type === 1225) {
      setObjectType("individual");
    }
  };

  return (
    <Box
      align="left"
      justify="start"
      direction="row"
      fill="horizontal"
      gap={GAP}
    >
      <Box basis="xsmall" pad="small" direction="row" align="end">
        {objectType === "kind" && <Cloud size="medium" />}
        {objectType === "individual" && <Iteration size="medium" />}
        {objectType === "" && <StatusUnknown size="medium" />}
      </Box>

      <Box basis="large" align="center" justify="center">
        <FormField
          name={`${name}-uid`}
          htmlFor={`${name}-uid-input`}
          label={`${name} UID`}
        >
          <TextInput
            id={`${name}-uid-input`}
            name={`${name}_uid`}
            value={objectUID}
            onChange={(e) => {
              // invalidate();
              setObjectUID(e.target.value);
              if (e.target.value.length >= 4) {
                doUIDSearch(e.target.value);
              }
            }}
            size={SIZE}
          />
        </FormField>
      </Box>
      <Box basis="large" align="center" justify="center">
        <FormField
          name={`${name}-name`}
          htmlFor={`${name}-name-input`}
          label={`${name} Name`}
        >
          <TextInput
            id={`${name}-name-input`}
            name={`${name}_name`}
            value={objectName}
            onChange={(e) => {
              invalidate();
              setObjectUID("1");
              setObjectName(e.target.value);
            }}
            suggestions={suggestions}
            onSuggestionSelect={(e) => {
              establishFact(e.suggestion.value);
            }}
            size={SIZE}
          />
        </FormField>
      </Box>
      <Box basis="xsmall" pad="small" align="end" direction="row">
        {suggestions.length > 0 && <MoreVertical size="medium" />}
      </Box>
      <Box basis="xsmall" pad="small" align="end" direction="row">
        <Button
          label=""
          icon={<Search />}
          onClick={() => {
            setFactTableIsOpen(true);
          }}
        />
      </Box>

      <FactTable
        factTableIsOpen={factTableIsOpen}
        setFactTableIsOpen={setFactTableIsOpen}
        callback={(fact) => {
          setFactTableIsOpen(false);
          establishFact(fact);
          doUIDSearch(fact.lh_object_uid);
        }}
      />
    </Box>
  );
};

export default ConceptIdentifier;
