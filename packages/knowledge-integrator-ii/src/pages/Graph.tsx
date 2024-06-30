import React, {
  useEffect,
  useState,
  memo,
  useCallback,
  useRef,
  useReducer,
} from "react";

import GraphView from "@relica/3d-graph-ui";
import { useStores } from "../context/RootStoreContext";

import { observer } from "mobx-react";
import { toJS } from "mobx";

import { useStore, useDataProvider } from "react-admin";
import { nodeData, edgeData } from "../types";

import GraphContextMenu from "../components/GraphContextMenu";
import SelectionDetails from "../components/SelectionDetails";

import { sockSendCC } from "../socket";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

const cats = {
  730044: "Physical Object",
  193671: "Occurrence",
  160170: "Role",
  790229: "Aspect",
  //970002: "Information",
  2850: "Relation",
};

const Graph = observer(() => {
  const theme = useTheme();
  const { factDataStore } = useStores();
  const { facts, categories } = factDataStore;

  const [selectedNode] = useStore("selectedNode");
  const [selectedEdge] = useStore("selectedEdge");
  const [paletteMap, setPaletteMap] = useStore("paletteMap", new Map());

  const selectNode = (id: number) => {
    sockSendCC("user", "selectEntity", { uid: id });
  };

  const handleNodeHover = (node: nodeData | null) => {
    // this.hoveredNode = node?.id || null;
  };

  const handleLinkHover = (link: edgeData | null) => {
    // this.hoveredLink = link?.id || null;
  };

  // START MENU
  const [open, setOpen] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [uid, setUid] = useState(0);
  const [type, setType] = useState("");

  const handleContextMenuTrigger = (
    uid: number,
    type: string,
    event: MouseEvent
  ) => {
    event.preventDefault();
    setX(event.clientX);
    setY(event.clientY);
    setUid(uid);
    setType(type);
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
    sockSendCC("user", "selectFact", { uid });
  };

  const onStageClick = () => {
    setOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      <Box>
        <h1>Graph</h1>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <GraphContextMenu
            open={open}
            handleClose={handleClose}
            x={x}
            y={y}
            uid={uid}
            type={type}
          />
          <GraphView
            categories={categories}
            facts={facts}
            onNodeClick={selectNode}
            onNodeRightClick={(uid: number, event: MouseEvent) => {
              handleContextMenuTrigger(uid, "entity", event);
            }}
            onStageClick={onStageClick}
            onEdgeRollOver={handleEdgeRollOver}
            onEdgeRollOut={handleEdgeRollOut}
            onEdgeClick={handleEdgeClick}
            onEdgeRightClick={(uid: number, event: MouseEvent) => {
              handleContextMenuTrigger(uid, "fact", event);
            }}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            paletteMap={paletteMap}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "384px",
            backgroundColor: "white",
          }}
        >
          <SelectionDetails />
        </Box>
      </Box>
    </Box>
  );
});

export default Graph;
