import { useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INodeEntity } from "../types/models.js";

/**
 * Enum for different levels of detail
 */
export enum DetailLevel {
  High = 0, // Closest to camera, highest detail
  Medium = 1, // Medium distance, medium detail
  Low = 2, // Far from camera, low detail
  Minimal = 3, // Very far, minimal detail
}

/**
 * Interface for node with detail level
 */
export interface NodeWithDetail {
  id: number;
  detailLevel: DetailLevel;
  distance: number;
}

/**
 * Configuration for level of detail thresholds
 */
export interface LODConfig {
  highDetailThreshold: number; // Distance threshold for high detail
  mediumDetailThreshold: number; // Distance threshold for medium detail
  lowDetailThreshold: number; // Distance threshold for low detail
}

// Default configuration values
const DEFAULT_LOD_CONFIG: LODConfig = {
  highDetailThreshold: 30,
  mediumDetailThreshold: 60,
  lowDetailThreshold: 100,
};

/**
 * Hook that calculates the appropriate level of detail for each node
 * based on its distance from the camera
 *
 * @param nodeData Map of node data
 * @param config Configuration for level of detail thresholds
 * @returns Array of nodes with their calculated detail levels
 */
export function useLevelOfDetail(
  nodeData: Map<number, INodeEntity>,
  config: LODConfig = DEFAULT_LOD_CONFIG
): NodeWithDetail[] {
  const [nodesWithDetail, setNodesWithDetail] = useState<NodeWithDetail[]>([]);
  const { camera } = useThree();

  useFrame(() => {
    const cameraPosition = camera.position;

    // Calculate distance and detail level for each node
    const updatedNodes = Array.from(nodeData.entries()).map(([id, node]) => {
      if (!node.pos) {
        // If node has no position, use minimal detail
        return { id, detailLevel: DetailLevel.Minimal, distance: Infinity };
      }

      const { x, y, z } = node.pos;
      const nodePosition = new THREE.Vector3(x, y, z);
      const distance = nodePosition.distanceTo(cameraPosition);

      // Determine detail level based on distance
      let detailLevel: DetailLevel;
      if (distance < config.highDetailThreshold) {
        detailLevel = DetailLevel.High;
      } else if (distance < config.mediumDetailThreshold) {
        detailLevel = DetailLevel.Medium;
      } else if (distance < config.lowDetailThreshold) {
        detailLevel = DetailLevel.Low;
      } else {
        detailLevel = DetailLevel.Minimal;
      }

      return { id, detailLevel, distance };
    });

    setNodesWithDetail(updatedNodes);
  });

  return nodesWithDetail;
}

/**
 * Get the appropriate geometry for a node based on its detail level
 *
 * @param detailLevel The detail level of the node
 * @returns The appropriate geometry for the node
 */
export function getNodeGeometryForDetailLevel(
  detailLevel: DetailLevel
): THREE.BufferGeometry {
  switch (detailLevel) {
    case DetailLevel.High:
      // High detail - use a sphere with more segments
      return new THREE.SphereGeometry(1, 16, 16);
    case DetailLevel.Medium:
      // Medium detail - use a sphere with fewer segments
      return new THREE.SphereGeometry(1, 8, 8);
    case DetailLevel.Low:
      // Low detail - use a simple icosahedron
      return new THREE.IcosahedronGeometry(1, 0);
    case DetailLevel.Minimal:
      // Minimal detail - use a simple box
      return new THREE.BoxGeometry(1, 1, 1);
    default:
      // Default to medium detail
      return new THREE.SphereGeometry(1, 8, 8);
  }
}

/**
 * Get the appropriate line segments for an edge based on detail level
 *
 * @param detailLevel The detail level of the edge
 * @param curve The curve to sample points from
 * @returns Array of points for the edge
 */
export function getEdgePointsForDetailLevel(
  detailLevel: DetailLevel,
  curve: THREE.Curve<THREE.Vector3>
): THREE.Vector3[] {
  // Number of points to sample based on detail level
  let numPoints: number;

  switch (detailLevel) {
    case DetailLevel.High:
      numPoints = 32; // High detail - more points
      break;
    case DetailLevel.Medium:
      numPoints = 16; // Medium detail
      break;
    case DetailLevel.Low:
      numPoints = 8; // Low detail
      break;
    case DetailLevel.Minimal:
      numPoints = 4; // Minimal detail - just a few points
      break;
    default:
      numPoints = 16; // Default to medium detail
  }

  // Sample points from the curve
  return curve.getPoints(numPoints);
}

export default useLevelOfDetail;
