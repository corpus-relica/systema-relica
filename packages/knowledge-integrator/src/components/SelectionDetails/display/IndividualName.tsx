import React, { useContext, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { 
  Check as CheckIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { updateModelName } from "../../../CCClient";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

interface IndividualNameProps {
  uid: number;
  name: string;
}

const IndividualName: React.FC<IndividualNameProps> = ({ uid, name }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);

  const [displayName, setDisplayName] = useState(name);

  useEffect(() => {
    setNewName(name);
    setDisplayName(name);
  }, [name]);

  const submitName = async () => {
    const result = await updateModelName(uid, newName);

    // TODO: this is a hack, in reality we need to complete the round trip on the update; show the actual updated definition state
    // definitions[currDefIdx].partial_definition = newPartialDef;
    // definitions[currDefIdx].full_definition = newFullDef;

    // TODO: would also need to update this model in the store

    setDisplayName(result.lh_object_name);
    setIsEditing(false);
  };

  const editionComp = (
    <>
      <TextField
        id="outlined-basic"
        label="name"
        variant="outlined"
        value={newName}
        onChange={(e) => {
          setNewName(e.target.value);
        }}
      />
      <Stack
        direction="row-reverse"
        gap="small"
        alignContent="end"
        border
        basis="full"
      >
        <IconButton onClick={submitName}>
          <CheckIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            setIsEditing(false);
          }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>
    </>
  );

  const displayComp = (
    <>
      <Typography size="12px" style={{ fontWeight: 500 }}>
        name:
      </Typography>
      <Typography size="10px">{displayName}</Typography>
    </>
  );

  const comp = isEditing ? editionComp : displayComp;

  return (
    <Grid container xs={12} border={1} padding={1}>
      {!isEditing && (
        <Grid item xs={1.3} border={1}>
          <IconButton onClick={() => setIsEditing(true)}>
            <EditIcon />
          </IconButton>
        </Grid>
      )}
      <Grid item xs={isEditing ? 12 : 10.7} border={1}>
        {comp}
      </Grid>
    </Grid>
  );
};

export default IndividualName;
