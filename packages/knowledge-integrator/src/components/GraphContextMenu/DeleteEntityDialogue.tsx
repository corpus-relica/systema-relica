import React, { useRef, useEffect, useContext, useState } from "react";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface DeleteEntityDialogueProps {
  uid: number;
  handleClose: () => void;
  handleOk: () => void;
}

const DeleteEntityDialogue: React.FC<DeleteEntityDialogueProps> = ({
  uid,
  handleClose,
  handleOk,
}) => {
  return (
    <Dialog open={true}>
      <DialogTitle>! Delete Entity !</DialogTitle>
      <DialogContent>
        <DialogContentText>
          you sure you want to delete this entity?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button onClick={handleOk}>Yes!</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteEntityDialogue;
