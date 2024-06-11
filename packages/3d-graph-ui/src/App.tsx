import React, { useEffect, useState, useRef } from "react";
// @ts-ignore
import * as THREE from "three";

import { Canvas } from "@react-three/fiber";
import { Stats, Stars } from "@react-three/drei";
import { NodeData, EdgeData, Fact } from "./types";
import GraphRenderer from "./GraphRenderer";

import RootStoreContext, { useStores } from "./context/RootStoreContext";
import RootStore from "./stores/RootStore";
import { observer } from "mobx-react";
import { toJS } from "mobx";

// import './index.css'
const rootStore = new RootStore();

export interface AppProps {
  categories: Array<{ uid: number; name: string; descendants: Array<number> }>;
  facts: Fact[];
  onNodeClick: (id: number) => void | null;
  onStageClick: () => void | null;
  onNodeRightClick: (id: number | null, e: MouseEvent) => void | null;
  onEdgeRollOver?: (id: number) => void | null;
  onEdgeRollOut?: (id: number) => void | null;
  selectedNode: number | null;
  onEdgeClick?: (id: number) => void | null;
  onEdgeRightClick?: (id: number | null, e: MouseEvent) => void | null;
  onEdgeClick?: (id: number) => void | null;
  onEdgeRightClick?: (id: number | null, e: MouseEvent) => void | null;
  paletteMap: Map<number, string> | null;
}

interface MouseEvent {
  altKey: boolean;
  button: number;
  buttons: number;
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
  metaKey: boolean;
  movementX: number;
  movementY: number;
  pageX: number;
  pageY: number;
  relatedTarget: EventTarget | null;
  screenX: number;
  screenY: number;
  shiftKey: boolean;
  type: string;
}

const App: React.FC<AppProps> = observer(
  ({
    categories,
    facts,
    onNodeClick,
    onNodeRightClick,
    onStageClick,
    onEdgeRollOver,
    onEdgeRollOut,
    selectedNode,
    paletteMap,
  }: AppProps) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);

    // if (onEdgeRollOver) rootStore.setOnEdgeRollOver(onEdgeRollOver);
    // if (onEdgeRollOut) rootStore.setOnEdgeRollOut(onEdgeRollOut);

    rootStore.setSelectedNode(selectedNode);
    rootStore.setPaletteMap(paletteMap);

    if (categories.length > 0) rootStore.setCategories(categories);

    useEffect(() => {
      // remove old facts
      rootStore.edgeData.forEach((edge) => {
        if (!facts.find((fact) => fact.fact_uid === edge.id)) {
          rootStore.removeEdge(edge.id);
        }
      });
      // find orphan nodes
      for (let k of rootStore.nodeData.keys()) {
        if (
          !facts.find(
            (fact) => fact.lh_object_uid === k || fact.rh_object_uid === k,
          )
        ) {
          rootStore.removeNode(k);
        }
      }

      // update existing facts
      // add new facts and nodes
      facts.forEach((fact: Fact) => {
        const {
          fact_uid,
          lh_object_uid,
          lh_object_name,
          rh_object_uid,
          rh_object_name,
          rel_type_uid,
          rel_type_name,
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

    useEffect(() => {
      const handleResize = () => {
        if (containerRef.current) {
          const { width, height } =
            //@ts-ignore
            containerRef.current.getBoundingClientRect();
          setDimensions({ width, height });
        }
      };

      handleResize(); // Call it initially
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    const mouse = useRef({ x: 0, y: 0 });
    const handleMouseDown = (e: MouseEvent) => {
      const { button } = e;
      mouse.current = { x: e.clientX, y: e.clientY };
      switch (button) {
        case 0:
          console.log("mouse down Left click");
          break;
        case 1:
          console.log("mouse down Middle click");
          break;
        case 2:
          console.log("mouse down Right click");
          break;
        default:
          console.log("mouse down Unknown click");
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const hoveredNode = rootStore.hoveredNode;
      const { button } = e;
      const dx = e.clientX - mouse.current.x;
      const dy = e.clientY - mouse.current.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const dragged = d > 2;
      switch (button) {
        case 0:
          console.log("mouse up Left click");
          if (!dragged && hoveredNode && onNodeClick) onNodeClick(hoveredNode);
          if (!dragged && !hoveredNode && onStageClick) onStageClick();
          break;
        case 1:
          console.log("mouse up Middle click");
          break;
        case 2:
          console.log("mouse up Right click");
          if (!dragged && hoveredNode && onNodeRightClick)
            onNodeRightClick(hoveredNode, e);
          if (!dragged && !hoveredNode && onNodeRightClick)
            onNodeRightClick(null, e);
          break;
        default:
          console.log("mouse up Unknown click");
      }
    };

    return (
      <RootStoreContext.Provider value={rootStore}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
          <div style={{ width: dimensions.width, height: dimensions.height }}>
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
              onClick={(e) => {
                console.log("MUTHERFUCKIN CLICK!!");
                console.log(e);
              }}
            >
              <GraphRenderer />
              <Stats />
              {/*<directionalLight
                color="orange"
                intensity={0.35}
                position={new THREE.Vector3(0, -1, 0)}
              />
              <directionalLight color="blue" intensity={0.35} />
              <ambientLight color="white" intensity={0.8} />*/}
              <ambientLight color="#404040" />
              {/*<directionalLight
                color="white"
                intensity={1.5}
                position={new THREE.Vector3(1, 1, 1)}
              />
              <directionalLight
                color="white"
                intensity={4.5}
                position={new THREE.Vector3(0, 1, 0)}
              />*/}
              <Stars
                radius={100}
                depth={375}
                count={1000}
                factor={4}
                saturation={0}
                fade
                speed={2}
              />
              <fog attach="fog" args={["#000000", 25, 100]} />
            </Canvas>
          </div>
        </div>
      </RootStoreContext.Provider>
    );
  },
);

export default App;
