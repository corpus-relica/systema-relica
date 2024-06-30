import React, { useContext, useState, useEffect } from "react";
import { updateModelDefinition } from "../../../CCClient";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

interface Def {
  fact_uid: number;
  partial_definition: string;
  full_definition: string;
}

interface DefinitionProps {
  definitions: Def[]; // specify the correct type instead of any if possible
}

const Definition: React.FC<DefinitionProps> = ({ definitions }) => {
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
      newFullDef
    );

    // TODO: this is a hack, in reality we need to complete the round trip on the update; show the actual updated definition state
    definitions[currDefIdx].partial_definition = newPartialDef;
    definitions[currDefIdx].full_definition = newFullDef;

    setIsEditing(false);
    setNewFullDef("");
    setNewPartialDef("");
  };
  const partialDefTitle = (
    <Typography size="12px" style={{ fontWeight: 500 }}>
      partial_definition:
    </Typography>
  );
  const fullDefTitle = (
    <Typography size="12px" style={{ fontWeight: 500 }}>
      full_definition:
    </Typography>
  );

  const editionUI = (
    <Box>
      {partialDefTitle}

      <TextField
        id="partial-def"
        label="partial definition"
        variant="outlined"
        value={newPartialDef}
        onChange={(e: any) => {
          setNewPartialDef(e.target.value);
        }}
        multiline
        rows={6}
      />
      {fullDefTitle}
      <TextField
        id="partial-def"
        label="partial definition"
        variant="outlined"
        value={newFullDef}
        onChange={(e: any) => {
          setNewFullDef(e.target.value);
        }}
        multiline
        rows={6}
      />
      <Stack direction="row-reverse" spacing={2}>
        <IconButton onClick={submitDef}>
          <CheckIcon />
        </IconButton>
        <IconButton onClick={() => setIsEditing(false)}>
          <CloseIcon />
        </IconButton>
      </Stack>
    </Box>
  );

  const displayUI = (
    <Box>
      {partialDefTitle}
      <Typography size="10px">
        {definitions[currDefIdx].partial_definition}
      </Typography>
      {fullDefTitle}
      <Typography size="10px">
        {definitions[currDefIdx].full_definition}
      </Typography>
    </Box>
  );

  const comp = isEditing ? editionUI : displayUI;

  const paginationStr = currDefIdx + 1 + "/" + definitions.length;
  return (
    <Box>
      <Stack direction="row" spacing={2}>
        <Typography size="12px" style={{ fontWeight: 600 }}>
          Definition {paginationStr} ({definitions[currDefIdx].fact_uid}):
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={() => {
              if (currDefIdx > 0) setCurrDefIdx(currDefIdx - 1);
            }}
          >
            <Typography style={{ height: "5px" }} size="10px">
              {"<<"}
            </Typography>
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (currDefIdx < definitions.length - 1)
                setCurrDefIdx(currDefIdx + 1);
            }}
          >
            <Typography style={{ height: "5px" }} size="10px">
              {">>"}
            </Typography>
          </Button>
        </Stack>
        {!isEditing && (
          <IconButton onClick={() => setIsEditing(true)}>
            <EditIcon />
          </IconButton>
        )}
      </Stack>
      {comp}
    </Box>
  );
};

export default Definition;
