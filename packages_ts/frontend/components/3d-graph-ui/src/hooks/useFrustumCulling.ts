import { useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { INodeEntity, IEdgeEntity } from "../types/models.js";

/**
 * Hook that calculates which nodes are within the camera's view frustum
 * and returns a list of visible node IDs.
 *
 * @param nodeData Map of node data
 * @param frustumCullingEnabled Whether frustum culling is enabled
 * @param margin Additional margin to add to the frustum (to prevent popping)
 * @returns Array of visible node IDs
 */
export function useFrustumCulling(
  nodeData: Map<number, INodeEntity>,
  frustumCullingEnabled: boolean = true,
  margin: number = 5
): number[] {
  const [visibleNodeIds, setVisibleNodeIds] = useState<number[]>([]);
  const { camera } = useThree();

  // Create a frustum object once
  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();

  useFrame(() => {
    if (!frustumCullingEnabled) {
      // If culling is disabled, all nodes are visible
      setVisibleNodeIds(Array.from(nodeData.keys()));
      return;
    }

    // Update the frustum with the current camera
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);

    // Create a slightly larger frustum for margin
    const marginFrustum = new THREE.Frustum();
    const marginMatrix = new THREE.Matrix4().copy(projScreenMatrix);

    // Adjust the projection matrix to create a margin
    // This is a simplified approach - a more accurate one would involve
    // adjusting the actual frustum planes
    marginMatrix.elements[0] *= 1 - margin / 100;
    marginMatrix.elements[5] *= 1 - margin / 100;
    marginFrustum.setFromProjectionMatrix(marginMatrix);

    // Filter nodes that are within the frustum
    const visible = Array.from(nodeData.entries())
      .filter(([, node]) => {
        if (!node.pos) return false;

        const { x, y, z } = node.pos;
        const point = new THREE.Vector3(x, y, z);

        // Check if the point is within the margin frustum
        return marginFrustum.containsPoint(point);
      })
      .map(([id]) => id);

    setVisibleNodeIds(visible);
  });

  return visibleNodeIds;
}

/**
 * Hook that calculates which edges are visible based on their connected nodes
 *
 * @param edgeData Map of edge data
 * @param visibleNodeIds Array of visible node IDs
 * @returns Array of visible edge IDs
 */
export function useVisibleEdges(
  edgeData: Map<number, IEdgeEntity>,
  visibleNodeIds: number[]
): number[] {
  const [visibleEdgeIds, setVisibleEdgeIds] = useState<number[]>([]);

  useEffect(() => {
    const visibleNodeSet = new Set(visibleNodeIds);

    // An edge is visible if both its source and target nodes are visible
    const visible = Array.from(edgeData.entries())
      .filter(([, edge]) => {
        return (
          visibleNodeSet.has(edge.source) && visibleNodeSet.has(edge.target)
        );
      })
      .map(([id]) => id);

    setVisibleEdgeIds(visible);
  }, [edgeData, visibleNodeIds]);

  return visibleEdgeIds;
}

export default useFrustumCulling;
