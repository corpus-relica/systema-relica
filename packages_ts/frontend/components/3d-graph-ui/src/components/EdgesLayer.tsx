import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../context/RootStoreContext.js";
import { EdgeData, Position, NodeData } from "../types.js";
import Edge from "./Edge.js";
import UnaryEdge from "./UnaryEdge.js";

export interface EdgesLayerProps {}

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

const origin = { x: 0, y: 0, z: 0 };

const EdgesLayer: React.FC<EdgesLayerProps> = observer(() => {
  const { edgeData, nodeData, hoveredLink, selectedEdge, paletteMap } =
    useStores();

  const uni: EdgeData[] = [];
  const bin: EdgeData[] = [];

  // Separate binary from unary links
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

  // Group the unary links by their source and target
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
        const { id, type, label, source }: EdgeData = link;
        const hovered: boolean = hoveredLink === id;
        const color: string = hovered ? "red" : paletteMap.get(type) || "white";
        const offset = parseFloat("0." + source);
        ret.push(
          <UnaryEdge
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
          <Edge
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

export default EdgesLayer;
