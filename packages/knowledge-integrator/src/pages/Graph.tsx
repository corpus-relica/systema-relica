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
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

import XXX from "@relica/fact-search-ui";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import GraphLegend from "../components/GraphLegend";

import GraphAndSelectionLayout from "./GraphToo";

const USER = "user";
const LOAD_SPECIALIZATION_HIERARCHY = "loadSpecializationHierarchy";

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
  const { factDataStore, colorPaletteStore } = useStores();
  const { paletteMap } = colorPaletteStore;
  const { facts, categories } = factDataStore;

  const [selectedNode] = useStore("selectedNode");
  const [selectedEdge] = useStore("selectedEdge");

  const [searchUIOpen, setSearchUIOpen] = useState(false);
  const [filter, setFilter] = useState<number>(0);

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
  };

  const handleEdgeRollOut = useCallback((uid: number) => {
    // graphViewStore.hoveredLinkType = null;
  }, []);

  const handleEdgeClick = (uid: any) => {
    sockSendCC(USER, "selectFact", { uid });
  };

  const onStageClick = () => {
    setOpen(false);
    sockSendCC(USER, "selectNone", {});
  };

  const handleSearchUIClose = (res: any) => {
    setSearchUIOpen(false);

    if (!res) return;

    const { lh_object_uid, rel_type_uid, rh_object_uid } = res;
    if (rel_type_uid === 1225) {
      sockSendCC(USER, LOAD_SPECIALIZATION_HIERARCHY, {
        uid: rh_object_uid,
      });
    } else {
      sockSendCC(USER, LOAD_SPECIALIZATION_HIERARCHY, {
        uid: lh_object_uid,
      });
    }
    selectNode(lh_object_uid);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
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
            filter={{ type: "should't matter", uid: filter }}
            callback={(res: any) => {
              handleSearchUIClose(res);
            }}
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
      <Stack direction="row">
        <Box>
          <h1>Graph</h1>
        </Box>
        <Box>
          <IconButton>
            <SearchIcon
              onClick={() => {
                setSearchUIOpen(true);
              }}
            />
          </IconButton>
        </Box>
      </Stack>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
        }}
      >
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
        />
      </Box>
    </Box>
  );
});

export default Graph;
