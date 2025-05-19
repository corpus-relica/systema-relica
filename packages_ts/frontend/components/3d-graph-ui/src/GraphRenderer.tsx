import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { observer } from "mobx-react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { useStores } from "./context/RootStoreContext.js";
import { NodeData, EdgeData, Position } from "./types.js";
import { ThreeIntersection } from "./types/three-types.js";

import Node from "./Node.js";
import Link from "./Link.js";
import UnaryLink from "./UnaryLink.js";
import useMouseRaycast from "./useMouseRaycast.js";

export interface GraphRendererProps {}

const origin = { x: 0, y: 0, z: 0 };

const CAMERA_TARGET_DISTANCE = 20;
const CAMERA_MAX_DISTANCE = 85;
const CAMERA_MIN_DISTANCE = 15;

type GroupedEdges = {
  [key: string]: EdgeData[];
};

function groupEdgesBySourceAndTarget(edges: EdgeData[]): GroupedEdges {
  const groupedEdges: GroupedEdges = {};

  edges.forEach((edge) => {
    const key: string = `${edge.source}-${edge.target}`;
    if (!groupedEdges[key]) {
      groupedEdges[key] = [];
    }
    groupedEdges[key].push(edge);
  });

  return groupedEdges;
}

const GraphRenderer: React.FC<GraphRendererProps> = observer(() => {
  const {
    wake: wakeSimulation,
    nodeData,
    edgeData,
    isRunning,
    selectedNode,
    selectedEdge,
    paletteMap,
    hoveredLink,
    setHoveredLink,
    unsetHoveredLink,
    getNodeColor,
    hoveredNode,
    setHoveredNode,
    unsetHoveredNode,
  } = useStores();
  const { camera } = useThree();
  // We need setCameraPosition but not cameraPosition
  const [, setCameraPosition] = useState(new THREE.Vector3(45, 0, 0));
  // Camera vector constant for reference
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cameraVec = new THREE.Vector3(CAMERA_TARGET_DISTANCE, 0, 0);

  useMouseRaycast((intersected: ThreeIntersection | null) => {
    if (intersected) {
      switch (intersected.object.userData.type) {
        case "node":
          if (hoveredNode !== intersected.object.userData.uid) {
            // console.log("Node:", intersected.object.userData.uid);
            setHoveredNode(intersected.object.userData.uid);
            unsetHoveredLink();
          }
          break;
        case "link":
          if (hoveredLink !== intersected.object.userData.uid) {
            // console.log("Link:", intersected.object.userData.uid);
            setHoveredLink(intersected.object.userData.uid);
            unsetHoveredNode();
          }
          break;
        default:
          console.log("Unknown object type");
      }
    } else {
      // No object is currently intersected by the mouse
      // console.log("No intersections");
      if (hoveredLink !== null) {
        unsetHoveredLink();
      }
      if (hoveredNode !== null) {
        unsetHoveredNode();
      }
    }
  });

  // @ts-expect-error - OrbitControls type from drei needs proper typing
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    if (selectedNode) {
      const node: NodeData | undefined = nodeData.get(selectedNode);
      if (!node) return;

      // @ts-expect-error - node.pos is optional but we know it exists here
      const { x, y, z }: Position | undefined = node.pos;

      // Set camera position offset from the target
      setCameraPosition(new THREE.Vector3(x, y, z));
      wakeSimulation();
    }
  }, [selectedNode]);

  useFrame(() => {
    if (!isRunning) return;
    if (!selectedNode) return;

    const node: NodeData | undefined = nodeData.get(selectedNode);
    if (!node) return;

    // @ts-expect-error - node.pos is optional but we provide a default
    const { x, y, z }: Position | null = node.pos || { x: 0, y: 0, z: 0 };

    // Calculate the direction vector from the origin to the target node
    const direction = new THREE.Vector3(x, y, z).normalize();

    // Define the distance from the target where the camera should be placed
    // This distance is now added to the distance from the origin to the target to place the camera on the other side
    const distance = CAMERA_TARGET_DISTANCE; // Set this to the desired distance

    // Calculate the camera's new position
    const targetDistance = new THREE.Vector3(x, y, z).length();
    const cameraPosition = direction.multiplyScalar(targetDistance + distance);

    // Move the camera to the new position
    camera.position.lerp(cameraPosition, 0.05);

    // Point the camera at the target node
    controlsRef.current.target.lerp(new THREE.Vector3(x, y, z), 0.1);
  });

  const uni: EdgeData[] = [];
  const bin: EdgeData[] = [];
  // separate binary from unary links
  Array.from(edgeData.values()).forEach((link: EdgeData) => {
    const { sourcePos = origin, targetPos = origin }: EdgeData = link;
    if (
      sourcePos.x === targetPos.x &&
      sourcePos.y === targetPos.y &&
      sourcePos.z === targetPos.z
    ) {
      uni.push(link);
    } else {
      bin.push(link);
    }
  });

  //need to group the unariy links by their source and target,
  // i.e. there may be multiople unary relations on a single node.
  const groupedUni: GroupedEdges = groupEdgesBySourceAndTarget(uni);
  const selfLinks = Object.keys(groupedUni).reduce(
    (memo: React.ReactNode[], key: string) => {
      const links: EdgeData[] = groupedUni[key] as EdgeData[];
      const ret: React.ReactNode[] = [];
      const node: NodeData | undefined = nodeData.get(links[0].source);
      const position: Position = node?.pos || { x: 0, y: 0, z: 0 };
      const pos: [number, number, number] = [
        position.x,
        position.y,
        position.z,
      ];

      links.forEach((link: EdgeData, idx: number) => {
        const {
          id,
          type,
          label,
          // sourcePos = origin,
          // targetPos = origin,
          source,
        }: EdgeData = link;
        const hovered: boolean = hoveredLink === id;
        const color: string = hovered ? "red" : paletteMap.get(type) || "white";
        const offset = parseFloat("0." + source);
        ret.push(
          <UnaryLink
            hovered={hovered}
            pos={pos}
            linksLength={links.length}
            key={id}
            idx={idx}
            offset={offset}
            id={id}
            color={color}
            label={label}
          />
        );
      });
      return memo.concat(ret);
    },
    []
  );

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        // @ts-expect-error - OrbitControls props are not fully typed
        maxDistance={CAMERA_MAX_DISTANCE}
        minDistance={CAMERA_MIN_DISTANCE}
      />
      {Array.from(nodeData.values()).map((node: NodeData) => {
        const { id, name, pos = origin }: NodeData = node;
        const color: string = getNodeColor(id);
        // const color: string = "white";
        return (
          <Node
            key={id}
            id={id}
            name={name}
            pos={pos}
            color={color}
            hovered={hoveredNode === id}
          />
        );
      })}
      {/*<Nodes />*/}
      {bin.map((link: EdgeData) => {
        const {
          id,
          type,
          label,
          sourcePos = origin,
          targetPos = origin,
        }: EdgeData = link;
        const color: string = paletteMap.get(type) || "white";
        return (
          <Link
            key={id}
            id={id}
            type={type}
            label={label}
            source={sourcePos}
            target={targetPos}
            baseColor={color}
            hovered={hoveredLink === id}
            selected={selectedEdge === id}
          />
        );
      })}
      {selfLinks}
    </>
  );
});

export default GraphRenderer;
