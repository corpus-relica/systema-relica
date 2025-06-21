import { fetchUtils } from 'react-admin';
import { getAuthToken } from '../authProvider';

const { fetchJson } = fetchUtils;

const apiUrl = import.meta.env.VITE_RELICA_API_URL;

const httpClient = (url: string, options: any = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  const token = getAuthToken();
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }
  return fetchJson(url, options);
};

const dataProvider = {
  getList: (resource: string, params: any): Promise<any> => {
    console.log("GETTING LIST", resource, params);
    switch (resource) {
      case "facts":
        return httpClient(`${apiUrl}/environment/retrieve`)
          .then(({ json }) => ({
            data: json.facts.map((fact: any) => ({ ...fact, id: fact.fact_uid })),
            total: json.facts.length,
          }));
          
      case "models":
        return httpClient(`${apiUrl}/environment/retrieve`)
          .then(({ json }) => ({
            data: json.models.map((model: any) => ({ ...model, id: model.model_uid })),
            total: json.models.length,
          }));

      default:
        return Promise.reject("Unknown resource");
    }
  },

  getOne: (resource: string, params: any): Promise<any> => {
    return httpClient(`${apiUrl}/model?uid=${params.uid}`)
      .then(({ json }) => ({
        data: { ...json, id: json.uid }
      }));
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
