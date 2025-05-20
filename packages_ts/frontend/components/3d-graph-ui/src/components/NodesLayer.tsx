import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../hooks/useStores.js";
import Node from "./Node.js";
import useFrustumCulling from "../hooks/useFrustumCulling.js";
import { INodeEntity } from "../types/models.js";

export interface NodesLayerProps {
  useInstancing?: boolean;
}

/**
 * Component that renders all nodes in the graph
 *
 * This component uses frustum culling to only render nodes that are visible
 * in the camera's view frustum, which significantly improves performance
 * for large graphs.
 */
const NodesLayer: React.FC<NodesLayerProps> = observer(() => {
  const { nodeData, getNodeColor, hoveredNode } = useStores();

  // Get all nodes as an array
  const allNodes = Array.from(nodeData.values());

  // Convert nodeData to a proper Map for frustum culling
  const nodeMap = new Map<number, INodeEntity>();
  allNodes.forEach((node) => {
    if (node) {
      nodeMap.set(node.id, node);
    }
  });

  // Use frustum culling to determine which nodes are visible
  const visibleNodeIds = useFrustumCulling(nodeMap);

  // Filter nodes to only include visible ones
  const visibleNodes = allNodes.filter(
    (node) => node && visibleNodeIds.includes(node.id)
  );

  return (
    <>
      {visibleNodes.map((node) => {
        const { id, name, pos = { x: 0, y: 0, z: 0 } } = node;
        const color: string = getNodeColor(id);

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
    </>
  );
});

export default NodesLayer;
