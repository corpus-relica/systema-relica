import { nodeData } from "../../types";

export const createNodeData = (
  id: number,
  label: string,
  type: string
): nodeData => {
  // console.log("createNodeData", id, label, type);
  return {
    id,
    name: label,
    val: 0.25, //type,
  };
};

export const createEdgeData = (
  source: number,
  target: number,
  label: number,
  id: number
) => {
  return {
    source,
    target,
    label,
    id,
  };
};

export const linkColor = (rel_type_uid: number) => {
  switch (rel_type_uid) {
    case 1225:
      return "#ff0000";
    case 1146:
      return "#00ff00";
    default:
      return "#ffffff";
  }
};
