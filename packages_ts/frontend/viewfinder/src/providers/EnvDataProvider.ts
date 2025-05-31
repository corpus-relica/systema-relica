import { DataProvider } from "react-admin";
import { portalClient } from "../io/PortalClient";

console.log("Creating EnvDataProvider...");

export const dataProvider: DataProvider = {
  getList: async (resource: string, params: any): Promise<any> => {
    console.log("GETTING ENV LIST", resource, params);

    try {
      switch (resource) {
        case "facts": {
          const response = await portalClient.retrieveEnvironment();
          return {
            data: response.facts.map((fact: any) => ({
              ...fact,
              id: fact.fact_uid,
            })),
            total: response.facts.length,
          };
        }
        case "models": {
          const response = await portalClient.retrieveEnvironment();
          return {
            data: response.models.map((model: any) => ({
              ...model,
              id: model.model_uid,
            })),
            total: response.models.length,
          };
        }
        default:
          throw new Error(`Unknown resource: ${resource}`);
      }
    } catch (error) {
      console.error(`Error in getList for ${resource}:`, error);
      throw error;
    }
  },

  getOne: async (resource: string, params: any): Promise<any> => {
    try {
      const response = await portalClient.retrieveModels([parseInt(params.uid)]);
      return {
        data: { ...response, id: response.uid },
      };
    } catch (error) {
      console.error(`Error in getOne for ${resource}:`, error);
      throw error;
    }
  },

  getMany: async (resource: string, params: any): Promise<any> => {
    try {
      if (resource === "models") {
        const response = await portalClient.retrieveModels(params.ids);
        return {
          data: response.map((item: any) => ({
            ...item,
            id: item.uid,
          })),
        };
      }
      throw new Error(`GetMany not implemented for resource: ${resource}`);
    } catch (error) {
      console.error(`Error in getMany for ${resource}:`, error);
      throw error;
    }
  },

  getManyReference: async (resource: string, params: any): Promise<any> => {
    throw new Error(
      `getManyReference not implemented for resource: ${resource}`
    );
  },

  create: async (resource: string, params: any): Promise<any> => {
    throw new Error(`create not implemented for resource: ${resource}`);
  },

  update: async (resource: string, params: any): Promise<any> => {
    try {
      switch (resource) {
        case "modelDefinition": {
          const response = await portalClient.updateModelDefinition(
            params.id,
            params.data.partial_definition,
            params.data.full_definition
          );
          return { data: { ...response, id: params.id } };
        }
        case "modelName": {
          const response = await portalClient.updateModelName(
            params.id,
            params.data.name
          );
          return { data: { ...response, id: params.id } };
        }
        case "modelCollection": {
          const response = await portalClient.updateModelCollection(
            params.id,
            params.data.collection_uid,
            params.data.collection_name
          );
          return { data: { ...response, id: params.id } };
        }
        default:
          throw new Error(`Update not implemented for resource: ${resource}`);
      }
    } catch (error) {
      console.error(`Error in update for ${resource}:`, error);
      throw error;
    }
  },

  updateMany: async (resource: string, params: any): Promise<any> => {
    throw new Error(`updateMany not implemented for resource: ${resource}`);
  },

  delete: async (resource: string, params: any): Promise<any> => {
    throw new Error(`delete not implemented for resource: ${resource}`);
  },

  deleteMany: async (resource: string, params: any): Promise<any> => {
    throw new Error(`deleteMany not implemented for resource: ${resource}`);
  },
};

export default dataProvider;
