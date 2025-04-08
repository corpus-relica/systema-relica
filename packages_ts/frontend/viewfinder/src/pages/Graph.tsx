import React, { useState, useCallback } from "react";

import { useStores } from "../context/RootStoreContext.js";

import { observer } from "mobx-react";

import { useStore } from "react-admin";

import { sockSendCC, sendSocketMessage, portalWs } from "../socket.js";

import { Drawer, IconButton, Paper, Slide, useTheme } from "@mui/material";

import Box from "@mui/material/Box";

import Fab from "@mui/material/Fab";
import CopyAllIcon from "@mui/icons-material/CopyAll.js";
import {
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

//TODO: rename "FactTable" to something more descriptive
import { FactTable } from "@relica/fact-search-ui";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";

import GraphAndSelectionLayout from "./GraphToo.js";
import { Fact } from "../types.js";

import { getAuthToken } from "../providers/AuthProvider.js";
import Chat, { Message } from "../components/Chat/index.js";

const USER = "user";
const LOAD_SPECIALIZATION_HIERARCHY = "loadSpecializationHierarchy";
const SELECT_ENTITY = "selectEntity";
const SELECT_NONE = "selectNone";

const Graph = observer(() => {
  const theme = useTheme();
  const { factDataStore,
          colorPaletteStore,
          userDataStore,
          nousDataStore} = useStores();
  const { paletteMap } = colorPaletteStore;
  const { facts, categories } = factDataStore;

  const [selectedNode] = useStore("selectedNode");
  const [selectedEdge] = useStore("selectedEdge");

  const [chatOpen, setChatOpen] = useState(true);
  const [searchUIOpen, setSearchUIOpen] = useState(false);
  const [filter, setFilter] = useState<number>(0);


  const token = getAuthToken();

  // START MENU
  const [open, setOpen] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [uid, setUid] = useState(0);
  const [type, setType] = useState("");
  const [relType, setRelType] = useState(0);

  const selectNode = (id: number) => {
    sendSocketMessage(SELECT_ENTITY, { uid: id });
  };

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
  };

  const handleEdgeRollOut = useCallback((uid: number) => {
    // graphViewStore.hoveredLinkType = null;
  }, []);

  const handleEdgeClick = (uid: any) => {
    sockSendCC(USER, "selectFact", { uid });
  };

  const onStageClick = () => {
    setOpen(false);
    sendSocketMessage(SELECT_NONE, {});
  };

  const handleSearchUIClose = (res: any) => {
    setSearchUIOpen(false);
    if (!res) return;
    const { lh_object_uid } = res;
    sendSocketMessage(LOAD_SPECIALIZATION_HIERARCHY, { uid: lh_object_uid });
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

  const onUserInputSubmit = (message: string) => {
    nousDataStore.addMessage('user', message)
    portalWs.send("chatUserInput", { message, "user-id": userDataStore.userID });
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
            bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#515151',
            border: `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#000'}`,
            p: 2,
          }}
        >
          <FactTable
            baseUrl={import.meta.env.VITE_PORTAL_API_URL || "http://localhost:2174"}
            token={token}
            filter={null}
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
        <Drawer
          variant="permanent"
          anchor="right"
          open={chatOpen}
          sx={{
            width: chatOpen ? 400 : 400,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 400,
              position: "fixed",
              height: "calc(100vh - 64px)",
              top: 64,
              borderLeft: theme.palette.mode === 'dark' ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.12)",
              transition: "transform 0.3s ease",
              transform: chatOpen ? "translateX(0)" : "translateX(380px)",
            },
          }}
        >
          <IconButton
            onClick={() => setChatOpen(!chatOpen)}
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "24px",
              borderRadius: 0,
              borderRight: theme.palette.mode === 'dark' ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.12)",
              backgroundColor: "background.paper",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            {chatOpen ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
          <Paper
            elevation={0}
            sx={{
              ml: 3,
              height: "100%",
              p: 2,
            }}
          >
            <div
              style={{
                height: "calc(100% - 40px)",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                borderRadius: 1,
                padding: 2,
              }}
            >
              <Chat messages={nousDataStore.messages} onSubmit={onUserInputSubmit} />
            </div>
          </Paper>
        </Drawer>
      </Box>
    </Box>
  );
});

export default Graph;
