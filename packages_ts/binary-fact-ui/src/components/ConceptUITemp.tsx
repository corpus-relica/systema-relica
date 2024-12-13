import React, { useCallback, useEffect, useState } from "react";
//@ts-ignore
import { Box, FormField, TextInput } from "grommet";

export interface ConceptUITempProps {
  uid: number;
  name?: string;
  onChange?: ({ uid, name }: { uid: number; name: string }) => void;
}

const ConceptUITemp = (props: ConceptUITempProps) => {
  const { uid, name, onChange } = props;
  const [displayName, setDisplayname] = React.useState(name);
  const [border, setBorder] = React.useState<any | null>(null);

  const validate = useCallback(() => {
    if (displayName === "" || displayName === undefined) {
      setBorder({ color: "red" });
    } else {
      setBorder(null);
    }
  }, [displayName]);

  useEffect(() => {
    if (uid !== undefined && name !== undefined && onChange)
      onChange({ uid: uid, name: name });
    validate();
  }, []);

  useEffect(() => {
    validate();
  }, [displayName]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayname(event.target.value);
    if (onChange) {
      onChange({ uid: uid, name: event.target.value });
    }
  };

  return (
    <Box direction="row" border={border}>
      <TextInput id="text-input-uid" disabled placeholder="uid" value={uid} />
      <TextInput
        id="text-input-name"
        placeholder="name"
        value={displayName}
        onChange={handleChange}
        disabled={name !== undefined}
      />
    </Box>
  );
};

export default ConceptUITemp;
