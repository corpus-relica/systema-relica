import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
// ------------------------------------------------------------
import Foo from "./definition/PhysicalObject";
import CreateAspect from "./misc/CreateAspect";
import CreateRole from "./misc/CreateRole";
import CreateRelation from "./misc/CreateRelation";
import CreateOccurrence from "./misc/CreateOccurrence";
import ReviewAspect from "./misc/ReviewAspect";
import CreateBinaryFact from "./misc/CreateBinaryFact";
import ClassifyIndividual from "./misc/ClassifyIndividual";
import CreateDate from "./misc/CreateDate";

import XXX from "@relica/fact-search-ui";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";

export default function BasicSelect() {
  const [form, setForm] = useState("");
  const [collection, setCollection] = useState({ uid: 0, name: "None" });
  const [open, setOpen] = useState(false);
  const [sfv, setSfv] = useState<(key: string, res: any) => void>(() => {});
  const [filter, setFilter] = useState<number>(0);
  const [openKey, setOpenKey] = useState("");

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

  // console.log("COLLECTION ITEMS:");
  // console.log(collectionItems);
  // console.log(isPending, isError, error);
  // console.log("-----------------");

  const handleChange = (event: SelectChangeEvent) => {
    console.log(event.target.value);
    setForm(event.target.value as string);
  };

  const handleCollectionChange = (event: SelectChangeEvent) => {
    const uid = event.target.value;
    if (uid === 0) {
      setCollection({ uid: 0, name: "None" });
      return;
    }
    const name = collectionItems.find((item: any) => item.uid === uid).name;
    setCollection({ uid: event.target.value, name: name });
  };

  const handleOpen = (key: string, setFieldValue: any, filter: number = 0) => {
    filter !== 730000 ? setFilter(filter) : setFilter(0);
    setSfv(() => (key, res) => {
      setFieldValue(key, res);
    });
    setOpenKey(key);
    setOpen(true);
  };

  const handleClose = (res: any) => {
    console.log(res);

    setFilter(0);
    if (
      res &&
      res.lh_object_uid &&
      res.lh_object_name &&
      res.rel_type_uid &&
      res.rel_type_name &&
      res.rh_object_uid &&
      res.rh_object_name
    ) {
      if (sfv && openKey) {
        console.log("Setting field value", openKey, res);
        sfv(openKey, res);
      }
    }
    setSfv(() => {});
    setOpenKey("");
    setOpen(false);
  };

  let element;
  switch (form) {
    case "dmpo":
      element = (
        <Foo
          handleOpen={handleOpen}
          handleClose={handleClose}
          collection={collection}
        />
      );
      break;
    case "create aspect":
      element = (
        <CreateAspect
          handleOpen={handleOpen}
          handleClose={handleClose}
          collection={collection}
        />
      );
      break;
    // case "review aspect":
    //   element = (
    //     <ReviewAspect handleOpen={handleOpen} handleClose={handleClose} />
    //   );
    //   break;
    case "create role":
      element = (
        <CreateRole
          handleOpen={handleOpen}
          handleClose={handleClose}
          collection={collection}
        />
      );
      break;
    case "create relation":
      element = (
        <CreateRelation
          handleOpen={handleOpen}
          handleClose={handleClose}
          collection={collection}
        />
      );
      break;
    case "create occurrence":
      element = (
        <CreateOccurrence
          handleOpen={handleOpen}
          handleClose={handleClose}
          collection={collection}
        />
      );
      break;
    case "create binary fact":
      element = (
        <CreateBinaryFact
          handleOpen={handleOpen}
          handleClose={handleClose}
          collection={collection}
        />
      );
      break;
    case "classify individual":
      element = (
        <ClassifyIndividual
          handleOpen={handleOpen}
          handleClose={handleClose}
          collection={collection}
        />
      );
      break;
    case "create date":
      element = (
        <CreateDate
          handleOpen={handleOpen}
          handleClose={handleClose}
          collection={collection}
        />
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
        onClose={() => {
          handleClose(null);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            bgcolor: "gray",
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
          <Button
            onClick={() => {
              handleClose(null);
            }}
          >
            Close
          </Button>
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
              <MenuItem value={"create role"}>Create Role</MenuItem>
              <MenuItem value={"create relation"}>Create Relation</MenuItem>
              <MenuItem value={"create occurrence"}>Create Occurrence</MenuItem>
              <MenuItem value={"create binary fact"}>
                Create Binary Fact
              </MenuItem>
              <MenuItem value={"classify individual"}>
                Classify Individual
              </MenuItem>
              <MenuItem value={"create date"}>Create Date</MenuItem>

              {/*<MenuItem value={"review aspect"}>Review Aspect</MenuItem>*/}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">
              Collection of Facts
            </InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={collection.uid}
              label="collection of facts"
              onChange={handleCollectionChange}
            >
              {collectionItems &&
                collectionItems
                  .concat([{ name: "None", uid: 0 }])
                  .map((item: any) => (
                    <MenuItem key={item.uid} value={item.uid}>
                      {item.name}
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>
        </Box>
        <Box>{element}</Box>
      </Box>
    </>
  );
}
