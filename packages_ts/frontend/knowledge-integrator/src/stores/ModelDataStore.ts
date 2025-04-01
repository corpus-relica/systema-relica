import { makeAutoObservable } from "mobx";

// Define types locally to avoid import issues
interface ModelElement {
  uid: number;
  name: string;
  nature: string;
  category: string;
  definitions: string[];
  supertypes: number[];
  "possible-kinds-of-roles"?: any[];
  "definitive-kinds-of-quantitative-aspects"?: any[];
  "definitive-kinds-of-intrinsic-aspects"?: any[];
}

interface QuintessentialModel {
  models: ModelElement[];
}

class ModelDataStore {
  models: ModelElement[] = [];
  quintessentialModel: QuintessentialModel | null = null;

  constructor() {
    console.log("ModelDataStore constructor");
    makeAutoObservable(this);
  }

  setModels = (models: ModelElement[]) => {
    this.models = models;
    this.updateQuintessentialModel();
  };

  addModel = (model: ModelElement) => {
    // Check if model already exists
    if (this.models.some((m) => m.uid === model.uid)) {
      console.log("Model already exists");
      return;
    }
    this.models.push(model);
    this.updateQuintessentialModel();
  };

  addModels = (newModels: ModelElement[]) => {
    console.log("Adding models to ModelDataStore:", newModels);
    // Filter out existing models
    const tempModels = this.models.filter((model) => {
      return !newModels.some((newModel) => {
        return model.uid === newModel.uid;
      });
    });
    this.models = [...tempModels, ...newModels];
    this.updateQuintessentialModel();
  };

  // Update the quintessential model structure when models change
  private updateQuintessentialModel = () => {
    if (this.models.length === 0) {
      this.quintessentialModel = null;
      return;
    }

    this.quintessentialModel = {
      models: this.models
    };
    console.log("Updated quintessential model with", this.models.length, "models");
  };

  // Process environment data to extract models
  processEnvironmentData = (environmentData: any) => {
    if (!environmentData || !environmentData.models) {
      console.log("No model data in environment");
      return;
    }

    console.log("Processing environment data for models:", environmentData.models);
    const models = environmentData.models.map((model: any) => {
      return {
        uid: model.uid,
        name: model.name,
        nature: model.nature || "kind",
        category: model.category || "concept",
        definitions: model.definitions || [],
        supertypes: model.supertypes || [],
        "possible-kinds-of-roles": model["possible-kinds-of-roles"] || [],
        "definitive-kinds-of-quantitative-aspects": model["definitive-kinds-of-quantitative-aspects"] || [],
        "definitive-kinds-of-intrinsic-aspects": model["definitive-kinds-of-intrinsic-aspects"] || []
      };
    });

    this.setModels(models);
  };

  getModelByUid = (uid: number) => {
    return this.models.find((model) => model.uid === uid);
  };
}

export default ModelDataStore;
