import { makeAutoObservable } from "mobx";

import { Fact, NodeData, EdgeData, Position } from "../types.js";

import createGraph, { Graph, Link } from "ngraph.graph";
import createLayout, { Layout, Vector } from "ngraph.forcelayout";
import RootStore from "./RootStore.js";

const physicsSettings = {
  timeStep: 1, //0.5,
  dimensions: 3,
  gravity: -6, // -12,
  theta: 0.8,
  springLength: 10,
  springCoefficient: 0.9,
  dragCoefficient: 0.9,
};

class SimulationStore {
  // nodePositions: Map<number, Position> = new Map();
  links: Map<number, Link> = new Map();

  graph: Graph;
  layout: Layout<Graph>;

  private rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;

    this.graph = createGraph();
    this.layout = createLayout(this.graph, physicsSettings);

    this.layout.simulator.addForce("hello", () => {
      this.graph.forEachLink((link) => {
        if (link.data.rel_type_uid === 1146) {
          const fromBody = this.layout.getBody(link.fromId);
          // @ts-ignore
          fromBody.force.y += -0.1; //0.1; // Negative value to force it downward
        }
      });
    });

    makeAutoObservable(this);
  }

  addLink = (edgeData: EdgeData, fact: Fact) => {
    this.graph.beginUpdate();
    if (!this.links.has(edgeData.id)) {
      const link = this.graph.addLink(edgeData.source, edgeData.target, fact);
      this.links.set(edgeData.id, link);
    }
    this.graph.endUpdate();
  };

  removeLink = (id: number) => {
    this.graph.beginUpdate();
    const link = this.links.get(id);
    if (link) {
      this.graph.removeLink(link);
      this.links.delete(id);
    }
    this.graph.endUpdate();
  };

  addEntity = (nodeData: NodeData) => {
    this.graph.beginUpdate();
    if (!this.graph.getNode(nodeData.id)) {
      const node = this.graph.addNode(nodeData.id);
      if (nodeData.id === 730000) {
        this.layout.pinNode(node, true);
        this.layout.setNodePosition(730000, 0, 25, 0);
      }
    }
    this.graph.endUpdate();
  };

  removeEntity = (id: number) => {
    this.graph.beginUpdate();
    const node = this.graph.getNode(id);
    if (node) {
      this.graph.removeNode(id);
    }
    this.graph.endUpdate();
  };

  // removeEntities = (nodeData: Array<NodeData>) => {
  //   this.graph.beginUpdate();
  //   nodeData.forEach(({ id }: { id: number }) => {
  //     if (this.graph.getNode(id)) {
  //       this.graph.removeNode(id);
  //     }
  //   });
  //   this.graph.endUpdate();
  // };

  // this is super inefficient (and or potentially confusing), but it works for now
  updateNodes() {
    const radius = 61.8;
    this.graph.forEachNode((node) => {
      // @ts-ignore
      const id: number = node.id;
      const nodePosition: any = this.layout.getNodePosition(id);

      // Calculate distance from the origin
      const distanceFromOrigin = Math.sqrt(
        nodePosition.x ** 2 + nodePosition.y ** 2 + nodePosition.z ** 2
      );

      // Check if the node is outside the bounding sphere
      if (distanceFromOrigin > radius) {
        // Normalize the node's position vector and scale it to the radius
        const scaleFactor = radius / distanceFromOrigin;
        nodePosition.x *= scaleFactor;
        nodePosition.y *= scaleFactor;
        nodePosition.z *= scaleFactor;
      }

      const pos: Position = {
        x: nodePosition.x,
        y: nodePosition.y,
        z: nodePosition.z || 0,
      };
      this.rootStore.setNodePosition(id, pos);

      const body = this.layout.getBody(id);
      if (body === undefined) return;
      body.pos.x = nodePosition.x;
      body.pos.y = nodePosition.y;
      body.pos.z = nodePosition.z;
    });
  }

  // this is also super inefficient, but it works for now
  updateEdges() {
    this.graph.forEachLink((link: Link) => {
      const { fromId, toId, data } = link;
      const source: Vector = this.layout.getNodePosition(fromId);
      const target: Vector = this.layout.getNodePosition(toId);
      const pos: { source: Position; target: Position } = {
        source: {
          x: source.x,
          y: source.y,
          z: source.z || 0,
        },
        target: {
          x: target.x,
          y: target.y,
          z: target.z || 0,
        },
      };
      this.rootStore.setEdgePositions(data.fact_uid, pos);
    });
  }

  stepLayout = () => {
    this.layout.step();
    this.updateNodes();
    this.updateEdges();
  };
}

export default SimulationStore;
