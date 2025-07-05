import React, { useContext, useState, useEffect } from "react";
import { updateModelDefinition } from "../../../CCClient";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { 
  Check as CheckIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon
} from "@mui/icons-material";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import Grid from "@mui/material/Grid";

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
        id="full-def"
        label="full definition"
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
    <Grid container xs={12} border={1}>
      <Typography fontSize="12px">
        {definitions[currDefIdx].full_definition}
      </Typography>
    </Grid>
  );

  const comp = isEditing ? editionUI : displayUI;

  const paginationStr = currDefIdx + 1 + "/" + definitions.length;
  return (
    <Grid contaienr xs={12} border={1} borderRadius={1} margin={1} padding={1}>
      <Grid container direction={"row"} xs={12}>
        <Typography variant="h7" fontSize={".9em"}>
          Definition {paginationStr} ({definitions[currDefIdx].fact_uid}):
        </Typography>
        <Grid container direction="row" xs={12}>
          {!isEditing && (
            <Grid xs={9}>
              <IconButton onClick={() => setIsEditing(true)}>
                <EditIcon />
              </IconButton>
            </Grid>
          )}
          <Grid xs={isEditing ? 12 : 3}>
            <IconButton
              variant="outlined"
              onClick={() => {
                if (currDefIdx > 0) setCurrDefIdx(currDefIdx - 1);
              }}
            >
              <ArrowLeftIcon />
            </IconButton>

            <IconButton
              variant="outlined"
              onClick={() => {
                if (currDefIdx < definitions.length - 1)
                  setCurrDefIdx(currDefIdx + 1);
              }}
            >
              <ArrowRightIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
      {comp}
    </Grid>
  );
};

export default Definition;
