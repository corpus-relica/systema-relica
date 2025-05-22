import React, { useState, useCallback, useRef, useEffect } from "react";
import { useStores } from "../context/RootStoreContext.js";
import { observer } from "mobx-react";
import { sockSendCC, sendSocketMessage, portalWs } from "../socket.js";
import { IconButton, Paper, Slide } from "@mui/material";
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
import SelectionDetails from "../components/SelectionDetails/index.js";

// Component for the resizable divider
interface ResizableDividerProps {
  onResize: (position: number) => void;
  position: number;
  setPosition: (position: number) => void;
}

const ResizableDivider = ({ onResize, position, setPosition }: ResizableDividerProps) => {
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };
  
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDragging) return;
      
      if (dividerRef.current && dividerRef.current.parentElement) {
        const container = dividerRef.current.parentElement;
        const containerRect = container.getBoundingClientRect();
        const newPosition = ((e.clientY - containerRect.top) / containerRect.height) * 100;
        
        // Limit the position between 10% and 90%
        const limitedPosition = Math.min(Math.max(newPosition, 10), 90);
        setPosition(limitedPosition);
        onResize(limitedPosition);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize, setPosition]);
  
  return (
    <Box
      ref={dividerRef}
      sx={{
        height: '8px',
        width: '100%',
        backgroundColor: '#333',
        cursor: 'row-resize',
        position: 'relative',
        zIndex: 10,
        '&:hover': {
          backgroundColor: '#444',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '30px',
          height: '4px',
          backgroundColor: '#666',
          borderRadius: '2px',
        }
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

const USER = "user";
const LOAD_SPECIALIZATION_HIERARCHY = "loadSpecializationHierarchy";
const SELECT_ENTITY = "selectEntity";
const SELECT_NONE = "selectNone";

const Graph = observer(() => {
  const { factDataStore,
          colorPaletteStore,
          userDataStore,
          nousDataStore} = useStores();
  const { paletteMap } = colorPaletteStore;
  const { facts, categories } = factDataStore;

  // Using local state for selected node/edge instead of useStore
  const [selectedNode, setSelectedNode] = useState<string | number | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | number | null>(null);

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(576); // Default width in pixels
  const [dividerPosition, setDividerPosition] = useState(50); // 50% as default position
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [searchUIOpen, setSearchUIOpen] = useState(false);
  const [filter, setFilter] = useState<number>(0);
  
  // Effect for horizontal resizing
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDraggingHorizontal) return;
      
      // Calculate the new width based on the mouse position
      const windowWidth = window.innerWidth;
      const newWidth = windowWidth - e.clientX;
      
      // Limit the width between 300px and 800px
      const limitedWidth = Math.min(Math.max(newWidth, 300), 800);
      setPanelWidth(limitedWidth);
    };
    
    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
    };
    
    if (isDraggingHorizontal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal]);

  const handleDividerResize = (position: number) => {
    setDividerPosition(position);
  };


  const token = getAuthToken();

  // START MENU
  const [open, setOpen] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [uid, setUid] = useState(0);
  const [type, setType] = useState("");
  const [relType, setRelType] = useState(0);

  const selectNode = (id: number) => {
    setSelectedNode(id);
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
    setSelectedEdge(uid);
    sockSendCC("selectFact", { uid });
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
            bgcolor: "#515151",
            border: "2px solid #000",
            p: 2,
          }}
        >
          {/* @ts-ignore */}
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
            top: 60,
            right: 10,
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
        {/* Horizontal resize handle and toggle button */}
        <Box
          sx={{
            position: "absolute",
            right: isPanelOpen ? `${panelWidth}px` : 0,
            top: 0,
            bottom: 0,
            width: "10px",
            cursor: "ew-resize",
            backgroundColor: "#333",
            zIndex: 1000,
            transition: isPanelOpen ? "none" : "right 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={(e: React.MouseEvent) => {
            setIsDraggingHorizontal(true);
            e.preventDefault();
          }}
        >
          <IconButton
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            sx={{
              backgroundColor: "#333",
              color: "white",
              width: "24px",
              height: "24px",
              "&:hover": {
                backgroundColor: "#444",
              },
            }}
          >
            {isPanelOpen ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>

        {/* Right Panel with Selection Details and Chat */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: `${panelWidth}px`,
            backgroundColor: "#515151",
            overflow: "hidden", // Hide overflow on the container
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            transform: isPanelOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s ease",
            zIndex: 100,
          }}
        >
          {/* Selection Details Container */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: `${dividerPosition}%`,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                paddingTop: "50px",
                overflowY: "auto", // Enable vertical scrolling
                "&::-webkit-scrollbar": {
                  width: "0.4em",
                },
                "&::-webkit-scrollbar-track": {
                  boxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
                  webkitBoxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0,0,0,.1)",
                  outline: "1px solid slategrey",
                },
              }}
            >
              <SelectionDetails />
            </Box>
          </Box>

          {/* Resizable Divider */}
          <ResizableDivider
            onResize={handleDividerResize}
            position={dividerPosition}
            setPosition={setDividerPosition}
          />

          {/* Chat Container */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: `${100 - dividerPosition}%`,
              overflow: "hidden",
              padding: 2,
            }}
          >
            <Chat messages={nousDataStore.messages} onSubmit={onUserInputSubmit} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export default Graph;
