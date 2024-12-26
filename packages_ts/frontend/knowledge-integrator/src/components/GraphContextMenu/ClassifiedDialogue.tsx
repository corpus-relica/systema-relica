import React, { useRef, useEffect, useContext, useState } from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { observer } from "mobx-react";
import RootStoreContext from "../../context/RootStoreContext";
import { Fact } from "../../types";

interface ClassifiedDialogueProps {
  uid: number;
  classified: Array<Fact>;
  existingSubtypes: Array<number>;
  handleClose: () => void;
  handleOk: (selected: number[], notSelected: number[]) => void;
}

const ClassifiedDialogue: React.FC<ClassifiedDialogueProps> = ({
  uid,
  classified,
  existingSubtypes,
  handleClose,
  handleOk,
}) => {
  const [value, setValue] = useState(existingSubtypes);

  const objs = classified.map((fact) => {
    const { lh_object_uid, lh_object_name } = fact;
    return { lh_object_uid, lh_object_name };
  });

  const alphaSortedObjs = objs.sort((a, b) => {
    if (a.lh_object_name < b.lh_object_name) {
      return -1;
    }
    if (a.lh_object_name > b.lh_object_name) {
      return 1;
    }
    return 0;
  });

  const checkBoxes = alphaSortedObjs.map((fact) => {
    const { lh_object_uid, lh_object_name } = fact;
    const labelTxt = `${lh_object_name} (${lh_object_uid})`;
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={value.includes(lh_object_uid)}
            onChange={(e) => {
              if (e.target.checked) {
                setValue([...value, lh_object_uid]);
              } else {
                setValue(value.filter((uid) => uid !== lh_object_uid));
              }
            }}
          />
        }
        label={labelTxt}
      />
    );
  });

  return (
    <Dialog open={true}>
      <DialogTitle>Show/Hide Classified</DialogTitle>
      <DialogContent>
        <DialogContentText>
          select which classified individuals to show/hide
        </DialogContentText>
        <FormGroup>{checkBoxes}</FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          onClick={() => {
            let notChecked = alphaSortedObjs.filter(
              (obj) => !value.includes(obj.lh_object_uid)
            );
            handleOk(
              value,
              notChecked.map((obj) => obj.lh_object_uid)
            );
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassifiedDialogue;
