import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

// Import your components here
import GraphContextMenu from "../components/GraphContextMenu";
import GraphLegend from "../components/GraphLegend";
import GraphView from "@relica/3d-graph-ui";
import SelectionDetails from "../components/SelectionDetails";

const GraphAndSelectionLayout = ({
  open,
  handleClose,
  x,
  y,
  uid,
  type,
  relType,
  categories,
  facts,
  selectNode,
  handleContextMenuTrigger,
  onStageClick,
  handleEdgeRollOver,
  handleEdgeRollOut,
  handleEdgeClick,
  selectedNode,
  selectedEdge,
  paletteMap,
  setSearchUIOpen,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden", // Prevent scrolling on the main container
      }}
    >
      {/* Graph View Container */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          backgroundColor: theme.palette.mode === 'dark' ? '#121212' : theme.palette.background.default,
          overflow: "hidden", // Prevent scrolling in the graph view
        }}
      >
        <GraphContextMenu
          open={open}
          handleClose={handleClose}
          x={x}
          y={y}
          uid={uid}
          type={type}
          relType={relType}
          setSearchUIOpen={setSearchUIOpen}
        />
        <GraphLegend />
        <Box sx={{ flexGrow: 1, position: "relative" }}>
          <GraphView
            categories={categories}
            facts={facts}
            onNodeClick={selectNode}
            onNodeRightClick={(uid, event) =>
              handleContextMenuTrigger(uid, "entity", event)
            }
            onStageClick={onStageClick}
            onEdgeRollOver={handleEdgeRollOver}
            onEdgeRollOut={handleEdgeRollOut}
            onEdgeClick={handleEdgeClick}
            onEdgeRightClick={(uid, event) => {
              const fact = facts.find((fact) => fact.fact_uid === uid);
              handleContextMenuTrigger(
                uid,
                "fact",
                event,
                fact && fact.rel_type_uid
              );
            }}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            paletteMap={paletteMap}
          />
        </Box>
      </Box>

      {/* Selection Details Container */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "384px",
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#515151',
          overflow: "hidden", // Hide overflow on the container
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
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
    </Box>
  );
};

export default GraphAndSelectionLayout;
