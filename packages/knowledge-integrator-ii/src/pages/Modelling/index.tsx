import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
// ------------------------------------------------------------
import Foo from "./definition/PhysicalObject";
import CreateAspect from "./misc/CreateAspect";
import ReviewAspect from "./misc/ReviewAspect";

import XXX from "@relica/fact-search-ui";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";

export default function BasicSelect() {
  const [form, setForm] = useState("");
  const [open, setOpen] = useState(false);
  const [sfv, setSfv] = useState<(key: string, res: any) => void>(() => {});
  const [filter, setFilter] = useState<number>(0);
  const [openKey, setOpenKey] = useState("");

  const handleChange = (event: SelectChangeEvent) => {
    console.log(event.target.value);
    setForm(event.target.value as string);
  };

  const handleOpen = (key: string, setFieldValue: any, filter: number = 0) => {
    setFilter(filter);
    setSfv(() => (key, res) => setFieldValue(key, res));
    setOpenKey(key);
    setOpen(true);
  };

  const handleClose = (res: any) => {
    setFilter(0);
    if (sfv && openKey) {
      console.log("Setting field value", openKey, res);
      sfv(openKey, res);
    }
    setSfv(() => {});
    setOpenKey("");
    setOpen(false);
  };

  let element;
  switch (form) {
    case "dmpo":
      element = <Foo handleOpen={handleOpen} handleClose={handleClose} />;
      break;
    case "create aspect":
      element = (
        <CreateAspect handleOpen={handleOpen} handleClose={handleClose} />
      );
      break;
    case "review aspect":
      element = (
        <ReviewAspect handleOpen={handleOpen} handleClose={handleClose} />
      );
      break;
    default:
      element = <div>DEFAULT</div>;
  }

  useEffect(() => {
    console.log("FORM: ", form);
  }, [form]);

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            bgcolor: "background.paper",
            border: "2px solid #000",
            p: 2,
          }}
        >
          <XXX
            filter={{ type: "should't matter", uid: filter }}
            callback={(res: any) => {
              handleClose(res);
            }}
          />
          <Button onClick={handleClose}>Close</Button>
        </Box>
      </Modal>
      <Box>
        <Box sx={{ minWidth: 120 }}>
          <h1>Modelling</h1>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Workflow</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={form}
              label="Workflow"
              onChange={handleChange}
            >
              <MenuItem value={"dmpo"}>
                Definition Model - Physical Object
              </MenuItem>
              <MenuItem value={"create aspect"}>Create Aspect</MenuItem>
              <MenuItem value={"review aspect"}>Review Aspect</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box>{element}</Box>
      </Box>
    </>
  );
}
