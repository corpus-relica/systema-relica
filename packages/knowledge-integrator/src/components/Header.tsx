import React, { useState, useContext } from "react";
import { Box, Button, Header as H } from "grommet";
import { Search } from "grommet-icons";
import { Fact } from "../types";
import FactTable from "./FactTable";
import RootStoreContext from "../context/RootStoreContext";
import { getSpecializationHierarchy } from "../RLCBaseClient";
import { toJS } from "mobx";
import { sockSendCC } from "../socket";

const Header: React.FC = () => {
  const { factDataStore, graphViewStore } = useContext(RootStoreContext);
  const { selectNode } = graphViewStore;
  // const { addFacts, addConcepts } = factDataStore;

  const [factTableIsOpen, setFactTableIsOpen] = useState(false);

  const performRequest = async (fact: Fact) => {
    const { lh_object_uid, rel_type_uid, rh_object_uid } = fact;
    setFactTableIsOpen(false);
    if (rel_type_uid === 1225) {
      sockSendCC("user", "getSpecializationHierarchy", { uid: rh_object_uid });
    } else {
      sockSendCC("user", "getSpecializationHierarchy", { uid: lh_object_uid });
    }
    selectNode(lh_object_uid);
  };

  const onSearchClick = function () {
    setFactTableIsOpen(true);
  };

  return (
    <H fill align="center" justify="center" direction="row">
      <Box align="center" justify="center" direction="row">
        <Button label="Search" icon={<Search />} onClick={onSearchClick} />
      </Box>
      <FactTable
        factTableIsOpen={factTableIsOpen}
        setFactTableIsOpen={setFactTableIsOpen}
        callback={performRequest}
      />
    </H>
  );
};

export default Header;
