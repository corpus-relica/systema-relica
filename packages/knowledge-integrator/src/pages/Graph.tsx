import React, { useState, useCallback } from "react";

import { useStores } from "../context/RootStoreContext";

import { observer } from "mobx-react";

import { useStore } from "react-admin";

import { portalSocket } from "../socket";
import { PortalUserActions } from "@relica/websocket-contracts";

import Box from "@mui/material/Box";

import Fab from "@mui/material/Fab";
import CopyAllIcon from "@mui/icons-material/CopyAll";

import XXX from "@relica/fact-search-ui";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";

import GraphAndSelectionLayout from "./GraphToo";
import { Fact } from "../types";

import authProvider, { getAuthToken } from "../authProvider";

const USER = "user";

const Graph = observer(() => {
  const rootStore = useStores();
  const { factDataStore, colorPaletteStore, authStore } = rootStore;
  const { paletteMap } = colorPaletteStore;
  const { facts, categories } = factDataStore;

  const [selectedNode] = useStore("selectedNode");
  const [selectedEdge] = useStore("selectedEdge");

  const [searchUIOpen, setSearchUIOpen] = useState(false);
  const [filter, setFilter] = useState<number>(0);

  const selectNode = (id: number) => {
    const userId = authStore.userId;
    const environmentId = rootStore.environmentId;
    portalSocket.send(PortalUserActions.SELECT_ENTITY, { userId, environmentId, uid: id });
  };

  const token = getAuthToken();

  // START MENU
  const [open, setOpen] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [uid, setUid] = useState(0);
  const [type, setType] = useState("");
  const [relType, setRelType] = useState(0);

  const handleContextMenuTrigger = async (
    uid: number,
    type: string,
    event: MouseEvent,
    rel_type_uid?: number
  ) => {
    event.preventDefault();
    setX(event.clientX);
    setY(event.clientY);
    setUid(uid);
    setType(type);
    rel_type_uid ? setRelType(rel_type_uid) : null;
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // END MENU

  const handleEdgeRollOver = (uid: number) => {
    // const fact = factDataStore.facts.find((fact) => fact.fact_uid === uid);
    // const uid2 = fact?.rel_type_uid;
    // graphViewStore.hoveredLinkType = uid2;
    console.log("EDGE ROLLOVER:", uid);
  };

  const handleEdgeRollOut = useCallback((uid: number) => {
    // graphViewStore.hoveredLinkType = null;
  }, []);

  const handleEdgeClick = (uid: any) => {
    portalSocket.send(PortalUserActions.SELECT_FACT, { uid });
  };

  const onStageClick = () => {
    setOpen(false);
    const userId = authStore.userId;
    const environmentId = rootStore.environmentId;
    portalSocket.send(PortalUserActions.SELECT_NONE, { userId, environmentId });
  };

  const handleSearchUIClose = async (res: any) => {
    setSearchUIOpen(false);

    if (!res) return;

    console.log("Search UI closed with result:", authStore.userId, res);

    const identityx = await authProvider.getIdentity();
    console.log("authprovider userId:", identityx);
    const { lh_object_uid } = res;
    portalSocket.send(USER + ":loadSpecializationHierarchy", {
      uid: lh_object_uid,
      userId: authStore.userId || identityx?.id || "unknown",
      environmentId: rootStore.environmentId,
    });
    selectNode(lh_object_uid);
  };

  const copyAll = () => {
    const factStrs = facts.map((fact: Fact) => {
      return `- ${fact.lh_object_name} -> ${fact.rel_type_name} -> ${
        fact.rh_object_name
      }${fact.full_definition ? " : " + fact.full_definition : ""}`;
    });
    navigator.clipboard.writeText(factStrs.join("\n"));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
      }}
    >
      <Modal
        open={searchUIOpen}
        onClose={() => {
          handleSearchUIClose(null);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            bgcolor: "#515151",
            border: "2px solid #000",
            p: 2,
          }}
        >
          <XXX
            token={token}
            filter={{ type: "should't matter", uid: filter }}
            callback={(res: any) => {
              handleSearchUIClose(res);
            }}
            height="90vh"
          />
          <Button
            onClick={() => {
              handleSearchUIClose(null);
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "absolute",
            top: 10,
            right: 395,
          }}
          onClick={copyAll}
        >
          <CopyAllIcon />
        </Fab>
        <GraphAndSelectionLayout
          open={open}
          handleClose={handleClose}
          x={x}
          y={y}
          uid={uid}
          type={type}
          relType={relType}
          categories={categories}
          facts={facts}
          selectNode={selectNode}
          handleContextMenuTrigger={handleContextMenuTrigger}
          onStageClick={onStageClick}
          handleEdgeRollOver={handleEdgeRollOver}
          handleEdgeRollOut={handleEdgeRollOut}
          handleEdgeClick={handleEdgeClick}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          paletteMap={paletteMap}
          setSearchUIOpen={setSearchUIOpen}
        />
      </Box>
    </Box>
  );
});

export default Graph;
