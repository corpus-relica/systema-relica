import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats, Stars } from "@react-three/drei";
import GraphScene from "./GraphScene.js";
import { Fact } from "../../types.js";
import { observer } from "mobx-react";
import { DOMMouseEvent as MouseEvent } from "../../types/three-types.js";
import { useStores } from "../../hooks/useStores.js";
import { INodeEntity, IEdgeEntity } from "../../types/models.js";

export interface GraphCanvasProps {
  dimensions: { width: number; height: number };
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

const GraphCanvas: React.FC<GraphCanvasProps> = observer(
  ({
    dimensions,
    categories,
    facts,
    onNodeClick,
    onNodeRightClick,
    onStageClick,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onEdgeRollOver,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onEdgeRollOut,
    onEdgeClick,
    onEdgeRightClick,
    selectedNode,
    selectedEdge,
    paletteMap,
  }) => {
    // Get the rootStore from context
    const rootStore = useStores();

    // Update store with props
    rootStore.setSelectedNode(selectedNode);
    rootStore.setSelectedEdge(selectedEdge);
    rootStore.setPaletteMap(paletteMap);

    if (categories.length > 0) rootStore.setCategories(categories);

    const mouse = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      const hoveredNodeUID = rootStore.hoveredNode;
      const hoveredLinkUID = rootStore.hoveredLink;
      const { button } = e;
      const dx = e.clientX - mouse.current.x;
      const dy = e.clientY - mouse.current.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const dragged = d > 2;

      switch (button) {
        case 0: // Left click
          if (!dragged && hoveredNodeUID && onNodeClick) {
            onNodeClick(hoveredNodeUID);
          } else if (!dragged && hoveredLinkUID && onEdgeClick) {
            onEdgeClick(hoveredLinkUID);
          } else if (
            !dragged &&
            !hoveredNodeUID &&
            !hoveredLinkUID &&
            onStageClick
          ) {
            onStageClick();
          }
          break;
        case 2: // Right click
          if (!dragged && hoveredNodeUID && onNodeRightClick) {
            onNodeRightClick(hoveredNodeUID, e);
          } else if (!dragged && hoveredLinkUID && onEdgeRightClick) {
            onEdgeRightClick(hoveredLinkUID, e);
          } else if (!dragged && !hoveredNodeUID && !hoveredLinkUID) {
            onNodeRightClick && onNodeRightClick(null, e);
            onEdgeRightClick && onEdgeRightClick(null, e);
          }
          break;
      }
    };

    // Process facts data
    useEffect(() => {
      // Get all current edge IDs
      const currentEdgeIds = new Set<number>();
      rootStore.edgeData.forEach((edge: IEdgeEntity | undefined) => {
        if (edge && edge.id !== undefined) {
          currentEdgeIds.add(edge.id);
        }
      });

      // Find edges to remove (edges in the store but not in the facts)
      currentEdgeIds.forEach((edgeId) => {
        if (!facts.find((fact) => fact.fact_uid === edgeId)) {
          rootStore.removeEdge(edgeId);
        }
      });

      // Get all current node IDs
      const currentNodeIds = new Set<number>();
      rootStore.nodeData.forEach((node: INodeEntity | undefined) => {
        if (node && node.id !== undefined) {
          currentNodeIds.add(node.id);
        }
      });

      // Find nodes to remove (nodes that aren't referenced in any fact)
      currentNodeIds.forEach((nodeId) => {
        if (
          !facts.find(
            (fact) =>
              fact.lh_object_uid === nodeId || fact.rh_object_uid === nodeId
          )
        ) {
          rootStore.removeNode(nodeId);
        }
      });

      // Add new nodes and edges
      facts.forEach((fact: Fact) => {
        const {
          fact_uid,
          lh_object_uid,
          lh_object_name,
          rh_object_uid,
          rh_object_name,
        } = fact;

        // Add left-hand node if it doesn't exist
        if (!rootStore.graphDataStore.hasNode(lh_object_uid)) {
          rootStore.addNode({
            id: lh_object_uid,
            name: lh_object_name,
            val: 0.25,
          });
        }

        // Add right-hand node if it doesn't exist
        if (!rootStore.graphDataStore.hasNode(rh_object_uid)) {
          rootStore.addNode({
            id: rh_object_uid,
            name: rh_object_name,
            val: 0.25,
          });
        }

        // Add edge if it doesn't exist
        if (!rootStore.graphDataStore.hasEdge(fact_uid)) {
          rootStore.addEdge(fact);
        }
      });

      // Start the simulation after all facts are processed
      rootStore.wake();
    }, [facts]);

    return (
      <>
        {/* @ts-expect-error - Canvas props are not fully typed */}
        <Canvas
          camera={{
            fov: 75,
            near: 0.01,
            far: 10000,
            position: [0, 0, 45],
          }}
          style={{ width: dimensions.width, height: dimensions.height }}
          onPointerDown={() => rootStore.setIsRunning(false)}
          onWheel={() => rootStore.setIsRunning(false)}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <GraphScene />
          <Stats />
          {/* @ts-expect-error - ambientLight props are not fully typed */}
          <ambientLight color="#404040" />
          <Stars
            radius={100}
            depth={375}
            count={1000}
            factor={4}
            saturation={0}
            fade
            speed={2}
          />
          {/* @ts-expect-error - fog props are not fully typed */}
          <fog attach="fog" args={["#000000", 25, 100]} />
        </Canvas>
      </>
    );
  }
);

export default GraphCanvas;
