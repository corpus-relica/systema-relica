import React, { useState, useCallback, useEffect } from "react";
import { Box, FormField, TextInput } from "grommet";
import FactTable from "./FactTable";
//@ts-ignore
import Fact from "@relica/types";

interface ConceptUIOpenFilterProps {
  filter: {
    type: string;
    uid: number;
  };
  onChange?: ({ uid, name }: { uid: number; name: string }) => void;
}

const ConceptUIOpenFilter = ({
  filter,
  onChange,
}: ConceptUIOpenFilterProps) => {
  // const { uid, type } = filter;
  const [factTableIsOpen, setFactTableIsOpen] = useState(false);
  const [chosenUID, setChosenUID] = useState(undefined);
  const [name, setName] = useState("");
  const [border, setBorder] = useState<any | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    setFactTableIsOpen(true);
  };

  const validate = useCallback(() => {
    if (name === "" || name === undefined) {
      setBorder({ color: "red" });
    } else {
      setBorder(null);
    }
  }, [name]);

  useEffect(() => {
    if (
      chosenUID !== undefined &&
      name !== undefined &&
      name !== "" &&
      onChange
    )
      onChange({ uid: chosenUID, name: name });
    validate();
  }, []);

  useEffect(() => {
    validate();
  }, [chosenUID, name]);

  const handleCallback = (fact: Fact) => {
    setChosenUID(fact.lh_object_uid);
    setName(fact.lh_object_name);
    setFactTableIsOpen(false);
    if (onChange)
      onChange({ uid: fact.lh_object_uid, name: fact.lh_object_name });
  };

  return (
    <>
      <Box direction="row" border={border}>
        <TextInput
          id="text-input-uid"
          placeholder="uid"
          value={chosenUID}
          onClick={handleClick}
        />
        <TextInput
          id="text-input-name"
          placeholder="name"
          value={name}
          onClick={handleClick}
        />
      </Box>
      <FactTable
        isOpen={factTableIsOpen}
        initialQuery={name}
        setIsOpen={setFactTableIsOpen}
        callback={handleCallback}
        filter={filter}
      />
    </>
  );
};

export default ConceptUIOpenFilter;
