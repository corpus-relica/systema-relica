import React, { useState, useEffect, useCallback } from "react";
//@ts-ignore
import { Box, FormField, TextInput } from "grommet";
import FactTable from "./FactTable";
//@ts-ignore
import Fact from "@relica/types";

interface ConceptUIOpenFactSearchProps {
  onChange?: ({ uid, name }: { uid: number; name: string }) => void;
}

const ConceptUIOpenFactSearch = ({
  onChange,
}: ConceptUIOpenFactSearchProps) => {
  const [uid, setUID] = useState<number | undefined>(undefined);
  const [name, setName] = useState("");
  const [factTableIsOpen, setFactTableIsOpen] = useState(false);
  const [border, setBorder] = React.useState<any | null>(null);

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
    if (uid !== undefined && name !== undefined && name !== "" && onChange)
      onChange({ uid: uid, name: name });
    validate();
  }, []);

  useEffect(() => {
    validate();
  }, [uid, name]);

  const handleCallback = (fact: Fact) => {
    setUID(fact.lh_object_uid);
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
          value={uid}
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
        setIsOpen={setFactTableIsOpen}
        callback={handleCallback}
        initialQuery={name}
      />
    </>
  );
};

export default ConceptUIOpenFactSearch;
