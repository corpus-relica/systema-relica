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
const SELECT_ENTITY = "selectEntity";
const SELECT_NONE = "selectNone";

const Graph = observer(() => {
  const { factDataStore, colorPaletteStore } = useStores();
  const { paletteMap } = colorPaletteStore;
  const { facts, categories } = factDataStore;

  const [selectedNode] = useStore("selectedNode");
  const [selectedEdge] = useStore("selectedEdge");

  const [searchUIOpen, setSearchUIOpen] = useState(false);
  const [filter, setFilter] = useState<number>(0);
  
  // State for view toggle
  const [showQuintessentialView, setShowQuintessentialView] = useState(false);
  const [quintessentialModelData, setQuintessentialModelData] = useState<any>(null);
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

  // Toggle between standard graph view and quintessential model view
  const handleViewToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const showQModel = event.target.checked;
    setShowQuintessentialView(showQModel);
    
    // Load sample quintessential model data when switching to that view
    if (showQModel && !quintessentialModelData) {
      // In a real implementation, we would fetch this from an API
      // For now, using sample data from the GitHub issue
      const sampleModelData = {
        models: [
          {
            "uid": 990007,
            "name": "man",
            "nature": "kind",
            "category": "physical object",
            "definitions": [
              "is a person who is male."
            ],
            "supertypes": [
              990010
            ],
            "possible-kinds-of-roles": [
              // Simplified for sample
              [[1000000731, "brother", 990007, "man"]],
              [[1000000780, "consultee", 990010, "person"]],
              [[990039, "customer", 990157, "social entity"]],
              [[640073, "provider", 990006, "lifeform"]],
              [[5137, "reference location", 160177, "material"]],
              [[4084, "used for segregation", 730044, "physical object"]],
              [[4888, "correlating aspect", 4990, "concept"]]
            ],
            "definitive-kinds-of-quantitative-aspects": [],
            "definitive-kinds-of-intrinsic-aspects": []
          },
          {
            "uid": 990010,
            "name": "person",
            "nature": "kind",
            "category": "physical object",
            "definitions": [
              "is a human being."
            ],
            "supertypes": [
              990006
            ],
            "definitive-kinds-of-quantitative-aspects": [],
            "definitive-kinds-of-intrinsic-aspects": []
          },
          {
            "uid": 990006,
            "name": "lifeform",
            "nature": "kind",
            "category": "physical object",
            "definitions": [
              "is a living organism."
            ],
            "supertypes": [
              730044
            ],
            "definitive-kinds-of-quantitative-aspects": [],
            "definitive-kinds-of-intrinsic-aspects": []
          },
          {
            "uid": 730044,
            "name": "physical object",
            "nature": "kind",
            "category": "physical object",
            "definitions": [
              "is a discrete body of matter."
            ],
            "supertypes": [],
            "definitive-kinds-of-quantitative-aspects": [],
            "definitive-kinds-of-intrinsic-aspects": []
          }
        ]
      };
      
      setQuintessentialModelData(sampleModelData);
    }
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
            label={showQuintessentialView ? "Quintessential Model" : "Standard Graph"}
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 10,
              backgroundColor: "rgba(81, 81, 81, 0.7)",
              padding: "0 10px",
              borderRadius: "4px",
              '& .MuiFormControlLabel-label': {
                color: "white"
              }
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
              }}
            >
              {quintessentialModelData && (
                <QuintessentialModelViz
                  model={quintessentialModelData}
                  onElementClick={handleModelElementClick}
                  selectedElement={selectedModelElement?.uid?.toString()}
                />
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
                  padding: 2,
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
                {selectedModelElement ? (
                  <div>
                    <h2>{selectedModelElement.name}</h2>
                    
                    {selectedModelElement.category && (
                      <p><strong>Category:</strong> {selectedModelElement.category}</p>
                    )}
                    
                    {selectedModelElement.nature && (
                      <p><strong>Nature:</strong> {selectedModelElement.nature}</p>
                    )}
                    
                    {selectedModelElement.definitions && selectedModelElement.definitions.length > 0 && (
                      <>
                        <h3>Definition:</h3>
                        {selectedModelElement.definitions.map((def: string, index: number) => (
                          <p key={index}>{def}</p>
                        ))}
                      </>
                    )}
                    
                    {selectedModelElement.supertypes && selectedModelElement.supertypes.length > 0 && (
                      <p><strong>Supertypes:</strong> {selectedModelElement.supertypes.join(', ')}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p>Select an element in the model to view its details.</p>
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