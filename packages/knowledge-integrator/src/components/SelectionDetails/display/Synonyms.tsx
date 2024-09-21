import React, { useState, useEffect } from "react";

import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AddIcon from "@mui/icons-material/Add";
import TextField from "@mui/material/TextField";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";

import { Fact } from "../../../types";

interface SynonymProps {
  synonymFacts: string[];
}

const Synonyms: React.FC<SynonymProps> = ({ synonymFacts }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [dialogueIsOpen, setDialogueIsOpen] = useState<boolean>(false);
  const [newSynName, setNewSynName] = useState<string>("");

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const closeDialogue = () => {
    setDialogueIsOpen(false);
  };

  const openDialogue = () => {
    setDialogueIsOpen(true);
  };

  const addSynonym = () => {
    setDialogueIsOpen(false);
    setNewSynName("");
  };

  const updateSynName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSynName(e.target.value);
  };

  const arrow = (
    <Grid xs={1}>
      {isOpen ? (
        <IconButton onClick={toggleOpen}>
          <ArrowDropDownIcon />
        </IconButton>
      ) : (
        <IconButton onClick={toggleOpen}>
          <ArrowRightIcon />
        </IconButton>
      )}
    </Grid>
  );

  const title = isOpen ? (
    <Grid xs={10}>
      <Typography>Synonyms</Typography>
    </Grid>
  ) : (
    <Grid xs={11}>
      <Typography>Synonyms</Typography>
    </Grid>
  );

  {
    /* <Grid xs={1}>
      <IconButton onClick={openDialogue}>
        <AddIcon />
      </IconButton>
    </Grid>*/
  }
  const addtlControls = isOpen ? null : null;

  return (
    <>
      <Grid container xs={12} border={1} padding={1}>
        {arrow}
        {title}
        {addtlControls}
        {isOpen ? (
          <ul>
            {synonymFacts &&
              synonymFacts.map((s: Fact) => (
                <li key={s.fact_uid}>{s.lh_object_name}</li>
              ))}
          </ul>
        ) : null}
      </Grid>
      <Dialog open={dialogueIsOpen}>
        <DialogTitle>Add Synonym</DialogTitle>
        <TextField
          label="New Synonyme"
          variant="outlined"
          value={newSynName}
          onChange={updateSynName}
        />
        <Button onClick={closeDialogue}>Cancel</Button>
        <Button onClick={addSynonym} color="primary">
          Add
        </Button>
      </Dialog>
    </>
  );
};

export default Synonyms;
