import React, { useRef, useEffect, useState } from "react";
import GraphCanvas from "./GraphCanvas.js";
import GraphControls from "./GraphControls.js";
import { Fact } from "../types.js";

export interface GraphContainerProps {
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

// Use the DOMMouseEvent type from our types file
import { DOMMouseEvent as MouseEvent } from "../types/three-types.js";

const GraphContainer: React.FC<GraphContainerProps> = ({
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
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    handleResize(); // Call it initially
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ width: dimensions.width, height: dimensions.height }}>
        <GraphCanvas
          dimensions={dimensions}
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
      </div>
      <GraphControls />
    </div>
  );
};

export default GraphContainer;
