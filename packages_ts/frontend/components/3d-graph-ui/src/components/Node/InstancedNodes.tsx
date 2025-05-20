import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { INodeEntity } from "../types/models.js";
import {
  DetailLevel,
  useLevelOfDetail,
  getNodeGeometryForDetailLevel,
} from "../hooks/useLevelOfDetail.js";
import MaterialService from "../services/rendering/MaterialService.js";

interface InstancedNodesProps {
  nodeData: Map<number, INodeEntity>;
  selectedNode: number | null;
  hoveredNode: number | null;
  getNodeColor: (id: number) => string;
  onNodeClick?: (id: number) => void;
}

/**
 * Component that renders nodes using instanced meshes for better performance
 *
 * This component groups nodes by their detail level and renders each group
 * using a single instanced mesh, which is much more efficient than rendering
 * individual meshes for each node.
 */
const InstancedNodes: React.FC<InstancedNodesProps> = ({
  nodeData,
  selectedNode,
  hoveredNode,
  getNodeColor,
}) => {
  // Get material service instance
  const materialService = useMemo(() => MaterialService.getInstance(), []);

  // Calculate level of detail for each node
  const nodesWithDetail = useLevelOfDetail(nodeData);

  // Group nodes by detail level
  const nodesByDetailLevel = useMemo(() => {
    const groups = new Map<DetailLevel, INodeEntity[]>();

    // Initialize groups for each detail level
    groups.set(DetailLevel.High, []);
    groups.set(DetailLevel.Medium, []);
    groups.set(DetailLevel.Low, []);
    groups.set(DetailLevel.Minimal, []);

    // Group nodes by their detail level
    nodesWithDetail.forEach(({ id, detailLevel }) => {
      const node = nodeData.get(id);
      if (node) {
        const group = groups.get(detailLevel);
        if (group) {
          group.push(node);
        }
      }
    });

    return groups;
  }, [nodeData, nodesWithDetail]);

  // Create a component for each detail level
  return (
    <>
      {Array.from(nodesByDetailLevel.entries()).map(([detailLevel, nodes]) => (
        <DetailLevelGroup
          key={detailLevel}
          detailLevel={detailLevel}
          nodes={nodes}
          selectedNode={selectedNode}
          hoveredNode={hoveredNode}
          getNodeColor={getNodeColor}
          materialService={materialService}
        />
      ))}
    </>
  );
};

interface DetailLevelGroupProps {
  detailLevel: DetailLevel;
  nodes: INodeEntity[];
  selectedNode: number | null;
  hoveredNode: number | null;
  getNodeColor: (id: number) => string;
  materialService: MaterialService;
}

/**
 * Component that renders a group of nodes with the same detail level
 * using a single instanced mesh
 */
const DetailLevelGroup: React.FC<DetailLevelGroupProps> = ({
  detailLevel,
  nodes,
  selectedNode,
  hoveredNode,
  getNodeColor,
  materialService,
}) => {
  // Create a reference to the instanced mesh
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Create the instanced mesh object
  const instancedMesh = useMemo(() => {
    if (nodes.length === 0) return null;

    const geometry = getNodeGeometryForDetailLevel(detailLevel);
    const material = materialService.getNodeMaterial("white");
    const mesh = new THREE.InstancedMesh(geometry, material, nodes.length);

    // Set user data for raycasting
    mesh.userData = {
      type: "node-group",
      nodeIndexMap: new Map(nodes.map((node, index) => [node.id, index])),
    };

    return mesh;
  }, [detailLevel, materialService, nodes]);

  // Set up the ref to the instanced mesh
  useEffect(() => {
    if (meshRef.current && instancedMesh) {
      meshRef.current = instancedMesh;
    }
  }, [instancedMesh]);

  // Create a temporary matrix for setting instance matrices
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  // Create a temporary color for setting instance colors
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Update instance positions and colors
  useFrame(() => {
    if (!instancedMesh || nodes.length === 0) return;
    // Update each instance
    nodes.forEach((node, index) => {
      // Set position
      if (node.pos && instancedMesh) {
        const { x, y, z } = node.pos;
        tempMatrix.setPosition(x, y, z);

        // Set scale based on node value or if it's selected/hovered
        const isSelected = node.id === selectedNode;
        const isHovered = node.id === hoveredNode;
        const scale = isSelected ? 1.5 : isHovered ? 1.2 : node.val || 1;

        tempMatrix.scale(new THREE.Vector3(scale, scale, scale));
        instancedMesh.setMatrixAt(index, tempMatrix);
      }

      // Set color
      if (instancedMesh) {
        const color = getNodeColor(node.id);
        tempColor.set(color);

        // Adjust color for selected/hovered state
        if (node.id === selectedNode) {
          tempColor.multiplyScalar(1.2); // Brighter for selected
        } else if (node.id === hoveredNode) {
          tempColor.multiplyScalar(1.1); // Slightly brighter for hovered
        }

        instancedMesh.setColorAt(index, tempColor);
      }
    });

    // Update the instance matrix and color buffers
    if (instancedMesh.instanceMatrix) {
      instancedMesh.instanceMatrix.needsUpdate = true;
    }

    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  });

  // Skip rendering if there are no nodes in this group
  if (nodes.length === 0 || !instancedMesh) return null;

  return (
    // @ts-expect-error - primitive props are not fully typed
    <primitive object={instancedMesh} frustumCulled={true} />
  );
};

export default InstancedNodes;
