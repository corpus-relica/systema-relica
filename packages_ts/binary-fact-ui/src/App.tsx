import React, { useState, useEffect } from "react";
import { Box, Text } from "grommet";
import ConceptUI from "./components/ConceptUI";
import { ConceptConfig } from "./components/ConceptUI";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//@ts-ignore
import { Fact } from "@relica/types";

const queryClient = new QueryClient();

export interface BinaryFactUIProps {
  config: FactConfig;
  setFact: (fact: Fact) => void;
}

export interface FactConfig {
  lh: ConceptConfig;
  rel: ConceptConfig;
  rh: ConceptConfig;
}

const App = ({ config, setFact }: BinaryFactUIProps) => {
  const { lh, rel, rh } = config;
  const [lh_object_uid, setLHObjectUID] = useState(-1);
  const [lh_object_name, setLHObjectName] = useState("");
  const [rel_type_uid, setRelTypeUID] = useState(-1);
  const [rel_type_name, setRelTypeName] = useState("");
  const [rh_object_uid, setRHObjectUID] = useState(-1);
  const [rh_object_name, setRHObjectName] = useState("");

  const updateFact = () => {
    if (
      lh_object_uid !== -1 &&
      lh_object_name !== "" &&
      rel_type_uid !== -1 &&
      rel_type_name !== "" &&
      rh_object_uid !== -1 &&
      rh_object_name !== ""
    ) {
      if (!setFact) return;
      setFact({
        lh_object_uid,
        lh_object_name,
        rel_type_uid,
        rel_type_name,
        rh_object_uid,
        rh_object_name,
      });
    }
  };

  useEffect(() => {
    updateFact();
  }, []);

  useEffect(() => {
    updateFact();
  }, [
    lh_object_uid,
    lh_object_name,
    rel_type_uid,
    rel_type_name,
    rh_object_uid,
    rh_object_name,
  ]);

  const handleChangeLH = ({ uid, name }: { uid: number; name: string }) => {
    setLHObjectUID(uid);
    setLHObjectName(name);
    // updateFact();
  };

  const handleChangeREL = ({ uid, name }: { uid: number; name: string }) => {
    setRelTypeUID(uid);
    setRelTypeName(name);
    // updateFact();
  };

  const handleChangeRH = ({ uid, name }: { uid: number; name: string }) => {
    setRHObjectUID(uid);
    setRHObjectName(name);
    // updateFact();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Box direction="row">
        <Box pad="small">
          <Text>left hand object</Text>
          <ConceptUI config={lh} onChange={handleChangeLH} />
        </Box>
        :
        <Box pad="small">
          <Text>rel type</Text>
          <ConceptUI config={rel} onChange={handleChangeREL} />
        </Box>
        :
        <Box pad="small">
          <Text>right hand object</Text>
          <ConceptUI config={rh} onChange={handleChangeRH} />
        </Box>
      </Box>
    </QueryClientProvider>
  );
};

export default App;
