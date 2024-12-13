import React, { useRef, useMemo, useState, useEffect } from "react";
//@ts-ignore
import * as THREE from "three";
import { useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { observer } from "mobx-react";
import { useStores } from "./context/RootStoreContext";
import { NodeData } from "./types";

const Nodes: React.FC = observer(() => {
  const { nodeData, isRunning, getNodeColor } = useStores();
  const { camera, gl } = useThree();
  const domElement = gl.domElement;
  const meshRef = useRef<THREE.InstancedMesh>();
  const hoveredIdRef = useRef<number | null>(null);
  const raycaster = new THREE.Raycaster();
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [offsets, setOffsets] = useState<Float32Array>(new Float32Array());
  const [count, setCount] = useState<number>(0);

  const color = new THREE.Color();

  useFrame(({ mouse: m }) => {
    mouseRef.current.copy(m);
    raycaster.setFromCamera(mouseRef.current, camera);
    const intersections = raycaster.intersectObject(meshRef.current!);

    if (intersections.length > 0) {
      if (hoveredIdRef.current === null) {
        //@ts-ignore
        const uid = Array.from(nodeData.keys())[intersections[0].instanceId];
        // console.log("ROLL OVER", uid);
        hoveredIdRef.current = uid;
      }
    } else {
      if (hoveredIdRef.current !== null) {
        // console.log("ROLL OUT", hoveredIdRef.current);
        hoveredIdRef.current = null;
      }
    }

    if (!isRunning) return;

    const positions = Array.from(nodeData.values()).map((node: NodeData) => {
      const ret = node?.pos || { x: 0, y: 0, z: 0 };
      return ret;
    });

    const temp = [];
    for (let i = 0; i < nodeData.size; i++) {
      const pos = positions[i];
      temp.push(pos?.x || 0, pos?.y || 0, pos?.z || 0);
    }

    setCount(nodeData.size);
    setOffsets(new Float32Array(temp));
  });

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    console.log(hoveredIdRef.current, "hoveredIdRef.current");
    // raycaster.setFromCamera(mouseRef.current, camera);
    // const intersections = raycaster.intersectObject(meshRef.current!);

    // if (intersections.length > 0) {
    //   const clickedInstanceId = intersections[0].instanceId;
    //   console.log(clickedInstanceId, "consistent ??");
    // }
  };
  const handleRightClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  useEffect(() => {
    domElement.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      handleClick(e);
    });
    domElement.addEventListener("contextmenu", (e: MouseEvent) => {
      e.preventDefault();
      handleRightClick(e);
    });
    return () => {
      console.log("cleaning up");
      domElement.removeEventListener("click", handleClick);
      domElement.removeEventListener("contextmenu", handleRightClick);
    };
  }, [domElement]);

  useEffect(() => {
    if (meshRef.current) {
      const tempNodeData = Array.from(nodeData.values());
      for (let i = 0; i < count; i++) {
        const uid = tempNodeData[i].id;
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.setPosition(
          offsets[i * 3],
          offsets[i * 3 + 1],
          offsets[i * 3 + 2],
        );
        meshRef.current.setMatrixAt(i, tempMatrix);
        meshRef.current.setColorAt(i, color.set(getNodeColor(uid)));
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [offsets, count]);

  return (
    //@ts-ignore
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial attach="material" />
    </instancedMesh>
  );
});

export default Nodes;
