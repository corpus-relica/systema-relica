import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats, Stars } from "@react-three/drei";
import GraphScene from "./GraphScene.js";
import { Fact } from "../types.js";
import RootStoreContext from "../context/RootStoreContext.js";
import RootStore from "../stores/RootStore.js";
import { observer } from "mobx-react";
import { DOMMouseEvent as MouseEvent } from "../types/three-types.js";

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

const rootStore = new RootStore();

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
    rootStore.setSelectedNode(selectedNode);
    rootStore.setSelectedEdge(selectedEdge);
    rootStore.setPaletteMap(paletteMap);

    if (categories.length > 0) rootStore.setCategories(categories);

    const mouse = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: MouseEvent) => {
      const { button } = e; // eslint-disable-line @typescript-eslint/no-unused-vars
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
      // remove old facts
      rootStore.edgeData.forEach((edge) => {
        if (!facts.find((fact) => fact.fact_uid === edge.id)) {
          rootStore.removeEdge(edge.id);
        }
      });

      // find orphan nodes
      for (const k of rootStore.nodeData.keys()) {
        if (
          !facts.find(
            (fact) => fact.lh_object_uid === k || fact.rh_object_uid === k
          )
        ) {
          rootStore.removeNode(k);
        }
      }

      // update existing facts and add new facts and nodes
      facts.forEach((fact: Fact) => {
        const {
          fact_uid,
          lh_object_uid,
          lh_object_name,
          rh_object_uid,
          rh_object_name,
        } = fact;

        if (!rootStore.nodeData.has(lh_object_uid)) {
          rootStore.addNode({
            id: lh_object_uid,
            name: lh_object_name,
            val: 0.25,
          });
        }

        if (!rootStore.nodeData.has(rh_object_uid)) {
          rootStore.addNode({
            id: rh_object_uid,
            name: rh_object_name,
            val: 0.25,
          });
        }

        if (!rootStore.edgeData.has(fact_uid)) {
          rootStore.addEdge(fact);
        }
      });
    }, [facts]);

    return (
      <RootStoreContext.Provider value={rootStore}>
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
      </RootStoreContext.Provider>
    );
  }
);

export default GraphCanvas;
