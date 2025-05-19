import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Position } from "./types.js";
import { Billboard, Plane, Text } from "@react-three/drei";
import { useStores } from "./context/RootStoreContext.js";
import { observer } from "mobx-react";

// Import only the colors we need
// No need for additional imports

export interface NodeProps {
  key: number;
  id: number;
  name: string;
  pos: Position;
  color: string;
  hovered: boolean;
}

// Remove unused texture loaders

// Custom hook to wait for geometry to be ready
function useGeometryBounds(meshRef: React.RefObject<THREE.Mesh>) {
  const [bounds, setBounds] = useState<Bounds>(null);

  useFrame(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
      }
      if (geometry.boundingBox) {
        setBounds({
          max: geometry.boundingBox.max,
          min: geometry.boundingBox.min,
        });
      }
    }
  });

  return bounds;
}

type Bounds = {
  max: { x: number; y: number; z: number };
  min: { x: number; y: number; z: number };
} | null;

const Node: React.FC<NodeProps> = observer(
  ({ id, name, pos, color, hovered }) => {
    const { selectedNode } = useStores();
    /*RefObject<
    THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>>
  >*/
    // Use any for now, but with a more specific type comment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textRef: any = useRef(null);
    const bounds: Bounds = useGeometryBounds(textRef);
    const [planeDimensions, setPlaneDimensions] = useState<[number, number]>([
      0, 0,
    ]);

    useEffect(() => {
      if (bounds) {
        // Now you have the bounds after the geometry is ready
        const padding = 0.5;
        setPlaneDimensions([
          bounds.max.x - bounds.min.x + padding + 0.3,
          bounds.max.y - bounds.min.y + padding,
        ]);
      }
    }, [bounds]);

    const { x, y, z }: Position = pos;
    const nodePosition = new THREE.Vector3(x, y, z);

    const positions = new Float32Array([x, y, z]); // Setting position directly in geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    useEffect(() => {
      if (textRef.current) {
        // Assuming the geometry will be updated once the text is fully loaded and rendered
        const textMesh = textRef.current;
        // @ts-expect-error - textMesh.geometry type is not properly defined
        textMesh.geometry.computeBoundingBox();
        const box = new THREE.Box3().setFromObject(textMesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        //setBounds({ width: size.x, height: size.y, depth: size.z });
      }
    }, [selectedNode, textRef.current]);

    const userData = { uid: id, type: "node" };
    return (
      <>
        {/* @ts-expect-error - group props are not fully typed */}
        <group>
          <Billboard
            position={nodePosition}
            follow
            // onClick={(e) => (onNodeClick ? onNodeClick(id, e) : null)}
            // onContextMenu={(e) =>
            //   onNodeRightClick ? onNodeRightClick(id, e) : null
            // }
          >
            <Plane
              userData={userData}
              args={planeDimensions}
              material-color={color}
              position={[0, 0.07, -0.01]}
              visible={selectedNode !== id}
              // onPointerOver={(e) => {
              //   e.stopPropagation();
              //   onNodeRollOver ? onNodeRollOver(id) : null;
              //   // console.log("HOVER");
              //   // setHover(true);
              // }}
              // onPointerOut={(e) => {
              //   e.stopPropagation();
              //   onNodeRollOut ? onNodeRollOut() : null;
              //   // console.log("HOVER OUT");
              //   // setHover(false);
              // }}
            />
            <Text
              userData={userData}
              ref={textRef}
              fontSize={selectedNode === id ? 1.5 : 0.55}
              outlineColor={selectedNode === id ? "#333" : "transparent"}
              outlineWidth={selectedNode === id ? 0.01 : 0}
              color={selectedNode === id ? color : "#333"}
              anchorX="center"
              anchorY="middle"
              position={new THREE.Vector3(0, 0, 0)}
              maxWidth={selectedNode === id ? 20 : 10}
            >
              {hovered || selectedNode === id ? id + " : " + name : name}
            </Text>
          </Billboard>

          {/* @ts-expect-error - group props are not fully typed */}
        </group>
      </>
    );
  }
);

export default Node;
