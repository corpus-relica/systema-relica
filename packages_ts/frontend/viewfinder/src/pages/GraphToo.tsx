import React from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

// Import your components here
import GraphContextMenu from "../components/GraphContextMenu/index.js";
import GraphLegend from "../components/GraphLegend.js";
import GraphView from "@relica/3d-graph-ui";

// Type assertion to handle component return type issues
const GraphContextMenuComponent = GraphContextMenu as any;
const GraphLegendComponent = GraphLegend as any;
const GraphViewComponent = GraphView as any;


interface GraphAndSelectionLayoutProps {
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  uid: string | number;
  type: string;
  relType?: string;
  categories: any[];
  facts: any[];
  selectNode: (nodeId: string | number) => void;
  handleContextMenuTrigger: (uid: string | number, type: string, event: React.MouseEvent, relType?: string) => void;
  onStageClick: () => void;
  handleEdgeRollOver: (edgeId: string | number) => void;
  handleEdgeRollOut: () => void;
  handleEdgeClick: (edgeId: string | number) => void;
  selectedNode: string | number | null;
  selectedEdge: string | number | null;
  paletteMap: Record<string, string>;
  setSearchUIOpen: (isOpen: boolean) => void;
}

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
}: GraphAndSelectionLayoutProps) => {
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
          backgroundColor: theme.palette.background.default,
          overflow: "hidden", // Prevent scrolling in the graph view
        }}
      >
        <GraphContextMenuComponent
          open={open}
          handleClose={handleClose}
          x={x}
          y={y}
          uid={uid}
          type={type}
          relType={relType}
          setSearchUIOpen={setSearchUIOpen}
        />
        <GraphLegendComponent />
        <Box sx={{ flexGrow: 1, position: "relative" }}>
          <GraphViewComponent
            categories={categories}
            facts={facts}
            onNodeClick={selectNode}
            onNodeRightClick={(uid: string | number, event: React.MouseEvent) =>
              handleContextMenuTrigger(uid, "entity", event)
            }
            onStageClick={onStageClick}
            onEdgeRollOver={handleEdgeRollOver}
            onEdgeRollOut={handleEdgeRollOut}
            onEdgeClick={handleEdgeClick}
            onEdgeRightClick={(uid: string | number, event: React.MouseEvent) => {
              const fact = facts.find((fact: any) => fact.fact_uid === uid);
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
    </Box>
  );
};

export default GraphAndSelectionLayout;
