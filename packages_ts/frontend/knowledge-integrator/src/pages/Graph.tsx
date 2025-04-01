import React, { useState, useCallback } from "react";

import { useStores } from "../context/RootStoreContext.js";

import { observer } from "mobx-react";

import { useStore } from "react-admin";

import { sockSendCC, sendSocketMessage } from "../socket.js";

import Box from "@mui/material/Box";

import Fab from "@mui/material/Fab";
import CopyAllIcon from "@mui/icons-material/CopyAll.js";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tooltip from "@mui/material/Tooltip";

//TODO: rename "FactTable" to something more descriptive
import { FactTable } from "@relica/fact-search-ui";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";

import GraphAndSelectionLayout from "./GraphToo.js";
import { QuintessentialModelViz } from "@relica/quintessential-model-viz";
import { Fact } from "../types.js";

import { getAuthToken } from "../providers/AuthProvider.js";

const USER = "user";
const LOAD_SPECIALIZATION_HIERARCHY = "loadSpecializationHierarchy";
const LOAD_MODEL = "loadModel";
const SELECT_ENTITY = "selectEntity";
const SELECT_NONE = "selectNone";

// Add JSX namespace declaration to fix IntrinsicElements errors
declare namespace JSX {
  interface IntrinsicElements {
    div: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >;
    h2: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLHeadingElement>,
      HTMLHeadingElement
    >;
    h3: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLHeadingElement>,
      HTMLHeadingElement
    >;
    p: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLParagraphElement>,
      HTMLParagraphElement
    >;
    strong: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
  }
}

const Graph = observer(() => {
  const { factDataStore, colorPaletteStore, modelDataStore } = useStores();
  const { paletteMap } = colorPaletteStore;
  const { facts, categories } = factDataStore;

  const [selectedNode] = useStore("selectedNode");
  const [selectedEdge] = useStore("selectedEdge");

  const [searchUIOpen, setSearchUIOpen] = useState(false);
  const [filter, setFilter] = useState<number>(0);

  // State for view toggle
  const [showQuintessentialView, setShowQuintessentialView] = useState(false);
  const [selectedModelElement, setSelectedModelElement] = useState<any>(null);

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
    sendSocketMessage(LOAD_MODEL, { uid: lh_object_uid });
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

  // Toggle between standard graph view and quintessential model view
  const handleViewToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const showQModel = event.target.checked;
    setShowQuintessentialView(showQModel);
  };

  const handleModelElementClick = (element: any) => {
    setSelectedModelElement(element);
    // Could also trigger selection in other parts of the system
    if (element && element.uid) {
      sendSocketMessage(SELECT_ENTITY, { uid: element.uid });
    }
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
          <FactTable
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
        {/* View Toggle Switch */}
        <Tooltip title="Switch between standard graph view and quintessential model view">
          <FormControlLabel
            control={
              <Switch
                checked={showQuintessentialView}
                onChange={handleViewToggle}
                color="primary"
              />
            }
            label={
              showQuintessentialView ? "Quintessential Model" : "Standard Graph"
            }
            sx={{
              position: "absolute",
              top: 55,
              left: 265,
              zIndex: 10,
              backgroundColor: "rgba(81, 81, 81, 0.7)",
              padding: "0 10px",
              borderRadius: "4px",
              "& .MuiFormControlLabel-label": {
                color: "white",
              },
            }}
          />
        </Tooltip>

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

        {/* Standard Graph View */}
        {!showQuintessentialView && (
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
        )}

        {/* Quintessential Model View */}
        {showQuintessentialView && (
          <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
            {/* Main visualization area */}
            <Box
              sx={{
                flexGrow: 1,
                position: "relative",
                backgroundColor: "#1a1a1a",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {modelDataStore.quintessentialModel && (
                <Box
                  sx={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden", // Prevent scrolling on the main container
                  }}
                >
                  <QuintessentialModelViz
                    model={modelDataStore.quintessentialModel}
                    onElementClick={handleModelElementClick}
                    selectedElement={selectedModelElement?.uid?.toString()}
                  />
                </Box>
              )}
            </Box>

            {/* Details panel (reusing the same space as in standard view) */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "384px",
                backgroundColor: "#515151",
                overflow: "hidden", // Hide overflow on the container
              }}
            >
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: "auto", // Enable vertical scrolling
                  padding: "16px",
                  color: "white",
                }}
              >
                {selectedModelElement ? (
                  <div>
                    <h2>{selectedModelElement.name || "Selected Element"}</h2>
                    <p>
                      <strong>Type:</strong>{" "}
                      {selectedModelElement.nature || "N/A"}
                    </p>
                    <p>
                      <strong>Category:</strong>{" "}
                      {selectedModelElement.category || "N/A"}
                    </p>
                    <p>
                      <strong>UID:</strong> {selectedModelElement.uid || "N/A"}
                    </p>

                    <h3>Definitions</h3>
                    <p>
                      {selectedModelElement.definitions &&
                      selectedModelElement.definitions.length > 0
                        ? selectedModelElement.definitions.join("; ")
                        : "No definitions available."}
                    </p>

                    <p>
                      <strong>Supertypes:</strong>{" "}
                      {selectedModelElement.supertypes &&
                      selectedModelElement.supertypes.length > 0
                        ? selectedModelElement.supertypes.join(", ")
                        : "None"}
                    </p>
                    <div>
                      {/* Additional details could be added here */}
                      <div>
                        <p>
                          {selectedModelElement["possible-kinds-of-roles"] &&
                          selectedModelElement["possible-kinds-of-roles"]
                            .length > 0
                            ? `${selectedModelElement["possible-kinds-of-roles"].length} possible roles`
                            : "No roles defined"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2>Quintessential Model</h2>
                    <p>Select an element to view details.</p>
                    <p>
                      This view shows the ontological structure of the knowledge
                      model.
                    </p>
                  </div>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
});

export default Graph;
