import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../context/RootStoreContext.js";
import { NodeData } from "../types.js";
import Node from "./Node.js";

export interface NodesLayerProps {}

const NodesLayer: React.FC<NodesLayerProps> = observer(() => {
  const { nodeData, getNodeColor, hoveredNode } = useStores();

  return (
    <>
      {Array.from(nodeData.values()).map((node: NodeData) => {
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
