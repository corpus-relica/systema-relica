import { DataProvider } from "react-admin";
import { archivistClient } from "../io/ArchivistBaseClient";

console.log("Creating ArchivistDataProvider...");

export const dataProvider: DataProvider = {
  getList: async (resource: string, params: any): Promise<any> => {
    console.log("ARCHIVIST::GETTING LIST", resource, params);

    try {
      switch (resource) {
        case "concept/entities": {
          const json = await archivistClient.resolveUIDs(params.uids);
          return {
            data: json.map((e: any) => ({ ...e, id: e.uid })),
            total: json.length,
          };
        }

        case "kinds": {
          // If you have a dedicated endpoint for paginated kinds, use that
          // For now, we'll keep the existing logic but use the axios client
          const sort = params.sort
            ? `["${params.sort.field}","${params.sort.order}"]`
            : '["id", "ASC"]';
          const rangeMin =
            params.pagination.page * params.pagination.perPage -
            params.pagination.perPage;
          const rangeMax = params.pagination.page * params.pagination.perPage;
          const range = `[${rangeMin}, ${rangeMax}]`;

          const response = await archivistClient.axiosInstance.get("/kinds", {
            params: {
              sort,
              range,
              filter: "{}",
            },
          });

          console.log("KINDS RESPONSE", response.data);

          return {
            data: response.data.data.map((e: any) => ({ ...e, id: e.uid })),
            total: response.data.total,
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
      switch (resource) {
        case "specialization": {
          const data = await archivistClient.getSpecializationHierarchy(
            params.id
          );
          return { data: { ...data, id: params.id } };
        }
        case "definition": {
          const data = await archivistClient.getDefinition(params.id);
          return { data: { ...data, id: params.id } };
        }
        case "entityType": {
          const data = await archivistClient.getEntityType(params.id);
          return { data: { ...data, id: params.id } };
        }
        default:
          throw new Error(`GetOne not implemented for resource: ${resource}`);
      }
    } catch (error) {
      console.error(`Error in getOne for ${resource}:`, error);
      throw error;
    }
  },

  getMany: async (resource: string, params: any): Promise<any> => {
    try {
      if (resource === "concept/entities") {
        const data = await archivistClient.resolveUIDs(params.ids);
        return {
          data: data.map((item: any) => ({
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
    try {
      switch (resource) {
        case "relatedFacts": {
          const data = await archivistClient.getAllRelatedFacts(
            params.id,
            params.depth || 1
          );
          return {
            data: data.map((item: any) => ({ ...item, id: item.uid })),
            total: data.length,
          };
        }
        default:
          throw new Error(
            `GetManyReference not implemented for resource: ${resource}`
          );
      }
    } catch (error) {
      console.error(`Error in getManyReference for ${resource}:`, error);
      throw error;
    }
  },

  create: async (resource: string, params: any): Promise<any> => {
    try {
      if (resource === "binaryFact") {
        const data = await archivistClient.submitBinaryFact(params.data);
        return { data: { ...data, id: data.uid } };
      }
      throw new Error(`Create not implemented for resource: ${resource}`);
    } catch (error) {
      console.error(`Error in create for ${resource}:`, error);
      throw error;
    }
  },

  update: async (resource: string, params: any): Promise<any> => {
    throw new Error(`Update not implemented for resource: ${resource}`);
  },

  updateMany: async (resource: string, params: any): Promise<any> => {
    throw new Error(`UpdateMany not implemented for resource: ${resource}`);
  },

  delete: async (resource: string, params: any): Promise<any> => {
    throw new Error(`Delete not implemented for resource: ${resource}`);
  },

  deleteMany: async (resource: string, params: any): Promise<any> => {
    throw new Error(`DeleteMany not implemented for resource: ${resource}`);
  },
};

export default dataProvider;
