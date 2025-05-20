import { useState, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Import the ThreeIntersection type from the types file
import { ThreeIntersection } from "./types/three-types.js";
import { useGraphDataStore } from "./hooks/useStores.js";

// Define a type for THREE.js intersection with instanceId
type ThreeJsIntersection = THREE.Intersection & {
  instanceId?: number;
};

/**
 * Custom hook for raycasting mouse interactions with objects in the scene
 *
 * This hook has been enhanced to support instanced meshes and node groups
 *
 * @param callback Function to call with the intersection result
 */
const useMouseRaycast = (
  callback: (intersection: ThreeIntersection | null) => void
) => {
  const { camera, scene, gl } = useThree();
  const [raycaster] = useState(() => new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const graphDataStore = useGraphDataStore();

  // Configure raycaster for better performance
  raycaster.params.Line.threshold = 0.2; // Increase line hit threshold
  raycaster.params.Points.threshold = 0.2; // Increase point hit threshold

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gl.domElement]);

  useFrame(() => {
    raycaster.setFromCamera(mouse.current, camera);

    // Use spatial indexing for more efficient raycasting
    // First, get the ray from the raycaster
    const ray = raycaster.ray;

    // Create a point far along the ray to define our search area
    const farPoint = new THREE.Vector3()
      .copy(ray.origin)
      .add(ray.direction.clone().multiplyScalar(100));

    // Define a search radius around the ray
    const searchRadius = 20;

    // Find potential nodes near the ray using spatial indexing
    // This helps narrow down which objects we need to test with the raycaster
    graphDataStore.findNodesInRadius(
      { x: farPoint.x, y: farPoint.y, z: farPoint.z },
      searchRadius
    );

    // Create a list of objects to test with the raycaster
    const objectsToTest: THREE.Object3D[] = [];

    // Add scene children that aren't nodes (like edges, UI elements)
    scene.children.forEach((child) => {
      if (child.userData.type !== "node-group") {
        objectsToTest.push(child);
      }
    });

    // Now perform the actual raycasting with a filtered set of objects
    const intersects = raycaster.intersectObjects(objectsToTest, true);

    if (intersects.length > 0) {
      const intersection = intersects[0] as ThreeJsIntersection;

      // Handle instanced meshes
      if (intersection.object instanceof THREE.InstancedMesh) {
        const instanceId = intersection.instanceId;

        // Check if this is a node group
        if (
          intersection.object.userData.type === "node-group" &&
          instanceId !== undefined
        ) {
          try {
            // Find the node ID from the instance index
            const nodeIndexMap = intersection.object.userData
              .nodeIndexMap as Map<number, number>;

            // Find the node ID that corresponds to this instance ID
            let nodeId: number | undefined;
            nodeIndexMap.forEach((index, id) => {
              if (index === instanceId) {
                nodeId = id;
              }
            });

            if (nodeId !== undefined) {
              // Create a modified intersection with the node ID
              // Cast to unknown first to avoid TypeScript errors
              const nodeIntersection = {
                ...intersection,
                object: Object.assign(new THREE.Object3D(), {
                  userData: { uid: nodeId, type: "node" },
                }),
              } as unknown as ThreeIntersection;

              callback(nodeIntersection);
              return;
            }
          } catch (error) {
            console.error(
              "Error processing instanced mesh intersection:",
              error
            );
          }
        }
      }

      callback(intersection as unknown as ThreeIntersection);
    } else {
      callback(null);
    }
  });
};

export default useMouseRaycast;
