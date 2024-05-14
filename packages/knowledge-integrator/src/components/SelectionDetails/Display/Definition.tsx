import React, { useContext, useState, useEffect } from "react";
import { FormPrevious, FormNext } from "grommet-icons";
import { Checkmark, Close, Edit } from "grommet-icons";
import { Box, Button, Text, TextArea } from "grommet";
import { observer } from "mobx-react";
import RootStoreContext from "../../../context/RootStoreContext";
import { toJS } from "mobx";
import { sockSendCC } from "../../../socket";
import { updateModelDefinition } from "../../../CCClient";

interface Def {
  fact_uid: number;
  partial_definition: string;
  full_definition: string;
}

interface DefinitionProps {
  definitions: Def[]; // specify the correct type instead of any if possible
}

const Definition: React.FC<DefinitionProps> = observer(({ definitions }) => {
  const { semanticModelStore } = useContext(RootStoreContext);
  const [isEditing, setIsEditing] = useState(false);
  const [newPartialDef, setNewPartialDef] = useState("");
  const [newFullDef, setNewFullDef] = useState("");
  const [currDefIdx, setCurrDefIdx] = useState(0);

  useEffect(() => {
    if (isEditing) {
      setNewFullDef(definitions[currDefIdx].full_definition);
      setNewPartialDef(definitions[currDefIdx].partial_definition);
    }
  }, [isEditing]);

  const submitDef = async () => {
    const result = await updateModelDefinition(
      definitions[currDefIdx].fact_uid,
      newPartialDef,
      newFullDef,
    );

    // TODO: this is a hack, in reality we need to complete the round trip on the update; show the actual updated definition state
    definitions[currDefIdx].partial_definition = newPartialDef;
    definitions[currDefIdx].full_definition = newFullDef;

    setIsEditing(false);
    setNewFullDef("");
    setNewPartialDef("");
  };

  const comp = isEditing ? (
    <Box gap="xsmall">
      <Text size="12px" style={{ fontWeight: 500 }} margin="small">
        partial_definition:
      </Text>
      <TextArea
        size="10px"
        plain
        fill
        value={newPartialDef}
        onChange={(e: any) => {
          setNewPartialDef(e.target.value);
        }}
      />
      <Text size="12px" style={{ fontWeight: 500 }}>
        full_definition:
      </Text>
      <TextArea
        size="10px"
        plain
        fill
        value={newFullDef}
        onChange={(e: any) => {
          setNewFullDef(e.target.value);
        }}
      />
      <Box
        direction="row-reverse"
        gap="small"
        alignContent="end"
        border
        basis="full"
      >
        <Button icon={<Checkmark />} onClick={submitDef} />
        <Button
          icon={<Close />}
          onClick={() => {
            setIsEditing(false);
          }}
        />
      </Box>
    </Box>
  ) : (
    <Box gap="xsmall">
      <Text size="12px" style={{ fontWeight: 500 }}>
        partial_definition:
      </Text>
      <Text size="10px">{definitions[currDefIdx].partial_definition}</Text>
      <Text size="12px" style={{ fontWeight: 500 }}>
        full_definition:
      </Text>
      <Text size="10px">{definitions[currDefIdx].full_definition}</Text>
    </Box>
  );

  const paginationStr = currDefIdx + 1 + "/" + definitions.length;
  return (
    <Box margin={{ vertical: "xsmall" }}>
      <Box direction="row" gap="small" alignContent="end" basis="full">
        <Text size="12px" style={{ fontWeight: 600 }} alignSelf="center">
          Definition {paginationStr} ({definitions[currDefIdx].fact_uid}):
        </Text>
        <Box direction="row">
          <Button
            style={{ height: "5px" }}
            size="xsmall"
            // icon={<FormPrevious style={{ height: "10px", width: "10px" }} />}
            onClick={() => {
              if (currDefIdx > 0) setCurrDefIdx(currDefIdx - 1);
            }}
          >
            <Text style={{ height: "5px" }} size="10px">
              {"<<"}
            </Text>
          </Button>
          <Button
            size="xsmall"
            // icon={<FormNext style={{ height: "10px", width: "10px" }} />}
            onClick={() => {
              if (currDefIdx < definitions.length - 1)
                setCurrDefIdx(currDefIdx + 1);
            }}
          >
            <Text size="10px">{">>"}</Text>
          </Button>
        </Box>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} icon={<Edit />} />
        )}
      </Box>
      {comp}
    </Box>
  );
});

export default Definition;
