import axios from "axios";

const CCAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_RELICA_CC_API_URL,
});

// interface GetListParams {
//   pagination: { page: number; perPage: number };
//   sort: { field: string; order: "ASC" | "DESC" };
//   filter: any;
//   meta?: any;
// }

// interface GetListResult {
//   data: Record[];
//   total?: number;
//   // if using partial pagination
//   pageInfo?: {
//     hasNextPage?: boolean;
//     hasPreviousPage?: boolean;
//   };
// }

// interface GetOneParams {
//   id: Identifier;
//   meta?: any;
// }

// interface GetOneResult {
//   data: Record;
// }

const dataProvider = {
  // get a list of records based on sort, filter, and pagination
  getList: (resource: string, params: any): Promise<any> => {
    console.log("GETTING LIST", resource, params);
    switch (resource) {
      case "facts":
        return CCAxiosInstance.get("environment/retrieve").then((response) => {
          response.data.facts.forEach((fact: any) => {
            fact.id = fact.fact_uid;
          });
          return {
            data: response.data.facts,
            total: response.data.facts.length,
          };
        });
      case "models":
        return CCAxiosInstance.get("environment/retrieve").then((response) => {
          response.data.models.forEach((model: any) => {
            model.id = model.model_uid;
          });
          return {
            data: response.data.models,
            total: response.data.models.length,
          };
        });
      default:
        //return rejected promise
        return Promise.reject("Unknown resource");
    }
  },

  // get a single record by id
  getOne: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 123, name: "hello" } });
  },
  // get a list of records based on an array of ids
  getMany: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 123, name: "hello" } });
  },
  // get the records referenced to another record, e.g. comments for a post
  getManyReference: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 123, name: "hello" } });
  },
  // create a record
  create: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 123, name: "hello" } });
  },
  // update a record based on a patch
  update: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 123, name: "hello" } });
  },
  // update a list of records based on an array of ids and a common patch
  updateMany: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 123, name: "hello" } });
  },
  // delete a record by id
  delete: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 123, name: "hello" } });
  },
  // delete a list of records based on an array of ids
  deleteMany: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 123, name: "hello" } });
  },
};

export default dataProvider;
