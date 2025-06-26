// import GraphViewStore from "./GraphViewStore";
import FactDataStore from "./FactDataStore";
// import EntityDataStore from "./EntityDataStore";
import ColorPaletteStore from "./ColorPaletteStore";
// import SemanticModelStore from "./SemanticModelStore";
import SetupStore from "./SetupStore";
import AuthStore from "./AuthStore";
import NOUSDataStore from "./NOUSDataStore";

export class RootStore {
  factDataStore: FactDataStore;
  // graphViewStore: GraphViewStore;
  // entityDataStore: EntityDataStore;
  colorPaletteStore: ColorPaletteStore;
  // semanticModelStore: SemanticModelStore;
  setupStore: SetupStore;
  authStore: AuthStore;
  nousDataStore: NOUSDataStore;

  private _environmentId: string | null;

  constructor() {
    console.log("RootStore constructor");
    this.factDataStore = new FactDataStore();
    // this.graphViewStore = new GraphViewStore();
    // this.entityDataStore = new EntityDataStore(this.factDataStore);
    // this.semanticModelStore = new SemanticModelStore(this.factDataStore);
    this.colorPaletteStore = new ColorPaletteStore(this.factDataStore);
    this.setupStore = new SetupStore();
    this.authStore = new AuthStore();
    this.nousDataStore = new NOUSDataStore();

    this._environmentId = null;
  }

  get environmentId() {
    return this._environmentId;
  }

  set environmentId(id: string) {
    console.log("Setting environmentId:", id);
    this._environmentId = id;
    // You can add any additional logic here if needed when the environmentId changes
  }
}

const rootStore = new RootStore();
export default rootStore;
