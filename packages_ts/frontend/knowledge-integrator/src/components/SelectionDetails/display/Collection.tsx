import React, { useContext, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery } from "@tanstack/react-query";
import { updateModelCollection } from "../../../io/CCBaseClient.js";
import Typography from "@mui/material/Typography";

import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

interface CollectionProps {
  uid: number;
  collection: { uid: number; name: string };
}

const Collection: React.FC<CollectionProps> = ({ uid, collection }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newCollUID, setNewCollUID] = useState(collection.uid);
  const [newCollName, setNewCollName] = useState(collection.name);

  const [displayName, setDisplayName] = useState(collection.name);

  const {
    isPending,
    isError,
    data: collectionItems,
    error,
  } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await fetch(
        "http://localhost:3000/retrieveEntity/collections"
      );
      return res.json();
    },
  });

  const submitColl = async () => {
    const result = await updateModelCollection(uid, newCollUID, newCollName);

    // TODO: this is a hack, in reality we need to complete the round trip on the update; show the actual updated definition state
    // definitions[currDefIdx].partial_definition = newPartialDef;
    // definitions[currDefIdx].full_definition = newFullDef;

    // TODO: would also need to update this model in the store

    setDisplayName(result.collection_name);
    setIsEditing(false);
  };

  const editionComp = (
    <>
      <FormControl fullWidth>
        <InputLabel id="select-label">Age</InputLabel>
        <Select
          labelId="select-label"
          id="simple-select"
          value={newCollName}
          label="collection"
          onChange={(e: SelectChangeEvent) => {
            const option = e.target.value;
            if (option === "None") {
              setNewCollName("None");
              setNewCollUID(0);
              return;
            }
            const coll = collectionItems.find((x: any) => x.name === option);
            setNewCollName(coll.name);
            setNewCollUID(coll.uid);
          }}
        >
          {collectionItems && collectionItems.length > 0
            ? collectionItems
                .concat([{ name: "None", uid: 0 }])
                .map((item: any) => (
                  <MenuItem value={item.name}>{item.name}</MenuItem>
                ))
            : null}
        </Select>
      </FormControl>
      <Stack
        direction="row-reverse"
        gap="small"
        alignContent="end"
        border
        basis="full"
      >
        <IconButton onClick={submitColl}>
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
        collection:
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

export default Collection;
