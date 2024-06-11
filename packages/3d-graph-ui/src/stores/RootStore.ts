import { makeAutoObservable, toJS, observable } from "mobx";
import { NodeData, EdgeData, Fact } from "../types";
import SimulationStore from "./SimulationStore";
import { Position } from "../types";
import { ThreeEvent } from "@react-three/fiber";

// Type definition
type Category = {
  [name: string]: {
    uid: number;
    descendants: Array<number>;
  };
};

class RootStore {
  simulationStore: SimulationStore;

  nodeData: Map<number, NodeData>;
  edgeData: Map<number, EdgeData> = new Map();

  hoveredLink: number | null = null;
  hoveredNode: number | null = null;
  selectedNode: number | null = null;
  selectedEdge: number | null = null;

  private sleepTimer: number = 0;
  private sleepDelay: number = 30000;
  isRunning: boolean = false;

  paletteMap: Map<number, string> = new Map();

  // Variable initialization with default value
  categories: Category = {};

  constructor() {
    makeAutoObservable(this);
    this.nodeData = observable.map<number, NodeData>();
    this.simulationStore = new SimulationStore(this);
  }

  addNode = (node: NodeData) => {
    if (!this.nodeData.has(node.id)) {
      this.nodeData.set(node.id, node);
      this.simulationStore.addEntity(node);
      this.wake();
    }
  };

  removeNode = (id: number) => {
    this.nodeData.delete(id);
    this.simulationStore.removeEntity(id);
    this.wake();
  };

  addEdge = (fact: Fact) => {
    if (!this.edgeData.has(fact.fact_uid)) {
      const source = fact.lh_object_uid;
      const target = fact.rh_object_uid;
      const edge: EdgeData = {
        id: fact.fact_uid,
        type: fact.rel_type_uid,
        label: fact.rel_type_name,
        source,
        target,
        // data: fact,
      };
      this.edgeData.set(fact.fact_uid, edge);
      // no need to simulate unary relation (self-loop)
      if (source !== target) this.simulationStore.addLink(edge, fact);
      this.wake();
    }
  };

  removeEdge = (id: number) => {
    this.edgeData.delete(id);
    this.simulationStore.removeLink(id);
    this.wake();
  };

  setNodePosition = (id: number, pos: Position) => {
    const node = this.nodeData.get(id);
    if (node) {
      this.nodeData.set(id, Object.assign({}, node, { pos }));
    }
  };

  setEdgePositions = (
    id: number,
    pos: { source: Position; target: Position }
  ) => {
    const edge = this.edgeData.get(id);
    if (edge) {
      this.edgeData.set(
        id,
        Object.assign({}, edge, {
          sourcePos: pos.source,
          targetPos: pos.target,
        })
      );
    }
  };

  wake = () => {
    this.isRunning = true;
    if (this.sleepTimer) {
      clearInterval(this.sleepTimer);
      this.sleepTimer = 0;
    } else {
      this.tickAnim();
    }
    //@ts-ignore
    this.sleepTimer = setTimeout(() => {
      this.isRunning = false;
    }, this.sleepDelay);
  };

  tickAnim = () => {
    requestAnimationFrame(() => {
      if (this.isRunning) {
        this.simulationStore.stepLayout();
        this.tickAnim();
      } else {
        clearInterval(this.sleepTimer);
        this.sleepTimer = 0;
      }
    });
  };

  setSelectedNode = (id: number | null) => {
    this.selectedNode = id;
  };

  setHoveredNode = (id: number | null) => {
    this.hoveredNode = id;
  };

  unsetHoveredNode = () => {
    this.hoveredNode = null;
  };

  setSelectedEdge = (id: number | null) => {
    this.selectedEdge = id;
  };

  setHoveredLink = (id: number | null) => {
    this.hoveredLink = id;
  };

  unsetHoveredLink = () => {
    this.hoveredLink = null;
  };

  setIsRunning = (isRunning: boolean) => {
    this.isRunning = isRunning;
  };

  setPaletteMap = (paletteMap: Map<number, string> | null) => {
    if (!paletteMap) {
      paletteMap = new Map();
    } else {
      this.paletteMap = paletteMap;
    }
  };

  setCategories = (
    newCats: Array<{
      uid: number;
      name: string;
      descendants: Array<number>;
    }> | null
  ) => {
    if (!newCats) {
      this.categories = {};
    } else {
      if (Object.keys(this.categories).length > 0) {
        console.log("WARN: categories already set");
        // we have to be very deliberate about updates here
        // for each category we have to check if the conents of cat.descendants
        // is different from the contents of this.categories[cat.name].descendants
        // if it is, we have to update the descendants
        // if it isn't, we can ignore it

        newCats.forEach((cat) => {
          if (this.categories[cat.name]) {
            const currDesc = this.categories[cat.name].descendants;
            const newDesc = cat.descendants;
            //set equality check
            // TODO: for now we are just going to check lengths, this should be sufficient for the additive case...if there is a deletion/insertion than we will need to be more meticulous
            if (currDesc.length !== newDesc.length) {
              console.log("did find a difference in descendants:", cat.name);
              this.categories[cat.name].descendants = cat.descendants;
            }
          } else {
            this.categories[cat.name] = {
              uid: cat.uid,
              descendants: cat.descendants,
            };
          }
        });
      } else {
        // TODO: somewher in the stack of this application must reduce unnecessary calls to this function
        newCats.forEach((cat) => {
          this.categories[cat.name] = {
            uid: cat.uid,
            descendants: cat.descendants,
          };
        });
      }
    }
  };

  // ["#8d70c9",
  // "#7fa44a",
  // "#ca5686",
  // "#49adad",
  // "#c7703f"]
  catColors: {
    [key: number]: string;
  } = {
    730044: "#8d70c9",
    193671: "#7fa44a",
    160170: "#ca5686",
    790229: "#49adad",
    //970002: "Information",
    2850: "#c7703f",
  };

  getNodeColor = (id: number) => {
    let color;
    let idx = 0;

    if (id === 730000) return "#fff";

    if (
      this.categories["Physical Object"].uid === id ||
      this.categories["Physical Object"].descendants.includes(id)
    ) {
      color = this.catColors[730044];
    } else if (
      this.categories["Occurrence"].uid === id ||
      this.categories["Occurrence"].descendants.includes(id)
    ) {
      color = this.catColors[193671];
    } else if (
      this.categories["Role"].uid === id ||
      this.categories["Role"].descendants.includes(id)
    ) {
      color = this.catColors[160170];
    } else if (
      this.categories["Aspect"].uid === id ||
      this.categories["Aspect"].descendants.includes(id)
    ) {
      color = this.catColors[790229];
    } else if (
      this.categories["Relation"].uid === id ||
      this.categories["Relation"].descendants.includes(id)
    ) {
      color = this.catColors[2850];
    }

    // console.log("getNodeColor", id, toJS(this.categories));
    // do {
    //   const cat = this.categories[idx];
    //   if (cat.descendants.includes(id) || cat.uid === id) {
    //     color = this.catColors[cat.uid];
    //   }
    //   idx++;
    // } while (color === undefined && idx < this.categories.length);

    return color || "#999";
  };
}

export default RootStore;
