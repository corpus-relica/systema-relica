import {
  reaction,
  IReactionDisposer,
  makeObservable,
  observable,
  action,
} from "mobx";
import { Fact } from "../types";
import FactDataStore from "./FactDataStore";
// import { createNodeData, createEdgeData } from "../components/Graph/utils";

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

//@ts-ignore
import { KIND, INDIVIDUAL } from "@relica/constants";
import { nodeData, edgeData } from "../types";

class GraphDataStore {
  private factDataStore: FactDataStore;
  private disposer: IReactionDisposer;

  nodes: Map<number, nodeData> = new Map();
  edges: Map<number, edgeData> = new Map();

  constructor(factDataStore: FactDataStore) {
    this.factDataStore = factDataStore;
    this.disposer = reaction(
      () => this.factDataStore.facts,
      (facts) => {
        this.updateNodesAndEdges(facts);
      }
    );
    makeObservable(this, {
      nodes: observable,
      edges: observable,
    });
  }

  updateNodesAndEdges(facts: Array<Fact>) {
    const nodes = this.nodes;
    const edges = this.edges;

    // Remove nodes
    const nodeIds = new Set<number>();
    const edgeIds = new Set<number>();
    facts.forEach((fact) => {
      const { fact_uid, lh_object_uid, rh_object_uid } = fact;
      nodeIds.add(lh_object_uid);
      nodeIds.add(rh_object_uid);
      edgeIds.add(fact_uid);
    });
    const nodeIdsToDelete = Array.from(nodes.keys()).filter(
      (id) => !nodeIds.has(id)
    );
    nodeIdsToDelete.forEach((id) => nodes.delete(id));

    // Remove edges
    const edgeIdsToDelete = Array.from(edges.keys()).filter(
      (id) => !edgeIds.has(id)
    );
    edgeIdsToDelete.forEach((id) => edges.delete(id));

    // Add new nodes
    facts.forEach((fact) => {
      const {
        lh_object_uid,
        lh_object_name,
        rel_type_uid,
        rh_object_uid,
        rh_object_name,
      } = fact;
      if (!nodes.has(lh_object_uid)) {
        const newNode: nodeData = createNodeData(
          lh_object_uid,
          lh_object_name,
          rel_type_uid === 1225 ? INDIVIDUAL : KIND
        );
        nodes.set(lh_object_uid, newNode);
      }
      if (!nodes.has(rh_object_uid)) {
        const newNode: nodeData = createNodeData(
          rh_object_uid,
          rh_object_name,
          KIND
        );
        nodes.set(rh_object_uid, newNode);
      }
    });

    // create edge data
    facts.forEach((fact) => {
      const { fact_uid, lh_object_uid, rel_type_uid, rh_object_uid } = fact;
      if (!edges.has(fact_uid)) {
        const newEdge: edgeData = createEdgeData(
          lh_object_uid,
          rh_object_uid,
          rel_type_uid,
          fact_uid
        );
        edges.set(fact_uid, newEdge);
      }
    });
  }

  get nodeData(): Array<nodeData> {
    return Array.from(this.nodes.values());
  }

  get edgeData(): Array<edgeData> {
    return Array.from(this.edges.values());
  }

  dispose() {
    // Call this method to stop the reaction when this store is no longer needed
    this.disposer();
  }
}

export default GraphDataStore;
