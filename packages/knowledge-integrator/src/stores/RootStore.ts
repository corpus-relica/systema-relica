// import GraphViewStore from "./GraphViewStore";
import FactDataStore from "./FactDataStore";
// import EntityDataStore from "./EntityDataStore";
import ColorPaletteStore from "./ColorPaletteStore";
// import SemanticModelStore from "./SemanticModelStore";
import SetupStore from "./SetupStore";
import AuthStore from "./AuthStore";

export class RootStore {
  factDataStore: FactDataStore;
  // graphViewStore: GraphViewStore;
  // entityDataStore: EntityDataStore;
  colorPaletteStore: ColorPaletteStore;
  // semanticModelStore: SemanticModelStore;
  setupStore: SetupStore;
  authStore: AuthStore;

  constructor() {
    console.log("RootStore constructor");
    this.factDataStore = new FactDataStore();
    // this.graphViewStore = new GraphViewStore();
    // this.entityDataStore = new EntityDataStore(this.factDataStore);
    // this.semanticModelStore = new SemanticModelStore(this.factDataStore);
    this.colorPaletteStore = new ColorPaletteStore(this.factDataStore);
    this.setupStore = new SetupStore();
    this.authStore = new AuthStore();
  }
}

const rootStore = new RootStore();
export default rootStore;
