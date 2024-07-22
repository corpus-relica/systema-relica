import React, { useRef, useEffect, useContext, useState } from "react";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface DeleteFactDialogueProps {
  uid: number;
  handleClose: () => void;
  handleOk: () => void;
}

const DeleteFactDialogue: React.FC<DeleteFactDialogueProps> = ({
  uid,
  handleClose,
  handleOk,
}) => {
  return (
    <Dialog open={true}>
      <DialogTitle>! Delete Fact !</DialogTitle>
      <DialogContent>
        <DialogContentText>
          you sure you want to delete this fact?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="success">
          No
        </Button>
        <Button onClick={handleOk} variant="outlined" color="error">
          Yes!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteFactDialogue;
