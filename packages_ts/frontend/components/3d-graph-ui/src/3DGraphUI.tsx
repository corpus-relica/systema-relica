import React from "react";
import { Fact } from "./types.js";
import GraphContainer from "./components/GraphContainer.js";
import { observer } from "mobx-react";

// Use the DOMMouseEvent type from our types file
import { DOMMouseEvent as MouseEvent } from "./types/three-types.js";

export interface ThreeDGraphUIProps {
  categories: Array<{ uid: number; name: string; descendants: Array<number> }>;
  facts: Fact[];
  onNodeClick: (id: number) => void | null;
  onStageClick: () => void | null;
  onNodeRightClick: (uid: number | null, e: MouseEvent) => void | null;
  onEdgeRollOver?: (id: number) => void | null;
  onEdgeRollOut?: (id: number) => void | null;
  onEdgeClick?: (id: number) => void | null;
  onEdgeRightClick?: (uid: number | null, e: MouseEvent) => void | null;
  selectedNode: number | null;
  selectedEdge: number | null;
  paletteMap: Map<number, string> | null;
}

/**
 * 3DGraphUI - Main component for the 3D graph visualization
 *
 * This component serves as the entry point for the 3D graph UI.
 * It delegates rendering responsibilities to specialized components
 * in a hierarchical structure.
 */
const ThreeDGraphUI: React.FC<ThreeDGraphUIProps> = observer(
  ({
    categories,
    facts,
    onNodeClick,
    onNodeRightClick,
    onStageClick,
    onEdgeRollOver,
    onEdgeRollOut,
    onEdgeClick,
    onEdgeRightClick,
    selectedNode,
    selectedEdge,
    paletteMap,
  }: ThreeDGraphUIProps) => {
    return (
      <GraphContainer
        categories={categories}
        facts={facts}
        onNodeClick={onNodeClick}
        onNodeRightClick={onNodeRightClick}
        onStageClick={onStageClick}
        onEdgeRollOver={onEdgeRollOver}
        onEdgeRollOut={onEdgeRollOut}
        onEdgeClick={onEdgeClick}
        onEdgeRightClick={onEdgeRightClick}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        paletteMap={paletteMap}
      />
    );
  }
);

export default ThreeDGraphUI;
