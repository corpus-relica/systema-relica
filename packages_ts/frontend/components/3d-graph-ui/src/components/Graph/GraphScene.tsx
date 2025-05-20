import React from "react";
import { observer } from "mobx-react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

import { useStores } from "../../context/RootStoreContext.js";
import NodesLayer from "../Node/NodesLayer.js";
import EdgesLayer from "../Edge/EdgesLayer.js";
import useMouseRaycast from "../../hooks/useMouseRaycast.js";
import { ThreeIntersection } from "../../types/three-types.js";

const CAMERA_TARGET_DISTANCE = 20;
const CAMERA_MAX_DISTANCE = 85;
const CAMERA_MIN_DISTANCE = 15;

export interface GraphSceneProps {}

const GraphScene: React.FC<GraphSceneProps> = observer(() => {
  const {
    wake: wakeSimulation,
    nodeData,
    isRunning,
    selectedNode,
    hoveredLink,
    setHoveredLink,
    unsetHoveredLink,
    hoveredNode,
    setHoveredNode,
    unsetHoveredNode,
  } = useStores();

  const { camera } = useThree();
  // We need setCameraPosition but not cameraPosition
  const [, setCameraPosition] = useState(new THREE.Vector3(45, 0, 0));

  useMouseRaycast((intersected: ThreeIntersection | null) => {
    if (intersected) {
      switch (intersected.object.userData.type) {
        case "node":
          if (hoveredNode !== intersected.object.userData.uid) {
            setHoveredNode(intersected.object.userData.uid);
            unsetHoveredLink();
          }
          break;
        case "link":
          if (hoveredLink !== intersected.object.userData.uid) {
            setHoveredLink(intersected.object.userData.uid);
            unsetHoveredNode();
          }
          break;
        default:
          console.log("Unknown object type");
      }
    } else {
      // No object is currently intersected by the mouse
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
      const node = nodeData.get(selectedNode);
      if (!node) return;

      // @ts-expect-error - node.pos is optional but we know it exists here
      const { x, y, z } = node.pos;

      // Set camera position offset from the target
      setCameraPosition(new THREE.Vector3(x, y, z));
      wakeSimulation();
    }
  }, [selectedNode]);

  useFrame(() => {
    if (!isRunning) return;
    if (!selectedNode) return;

    const node = nodeData.get(selectedNode);
    if (!node) return;

    const { x, y, z } = node.pos || { x: 0, y: 0, z: 0 };

    // Calculate the direction vector from the origin to the target node
    const direction = new THREE.Vector3(x, y, z).normalize();

    // Define the distance from the target where the camera should be placed
    const distance = CAMERA_TARGET_DISTANCE;

    // Calculate the camera's new position
    const targetDistance = new THREE.Vector3(x, y, z).length();
    const cameraPosition = direction.multiplyScalar(targetDistance + distance);

    // Move the camera to the new position
    camera.position.lerp(cameraPosition, 0.05);

    // Point the camera at the target node
    controlsRef.current.target.lerp(new THREE.Vector3(x, y, z), 0.1);
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        // @ts-expect-error - OrbitControls props are not fully typed
        maxDistance={CAMERA_MAX_DISTANCE}
        minDistance={CAMERA_MIN_DISTANCE}
      />
      <NodesLayer />
      <EdgesLayer />
    </>
  );
});

export default GraphScene;
