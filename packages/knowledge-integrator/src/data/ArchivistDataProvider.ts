import { fetchJson } from 'ra-core';

// Add a function to get the token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('access_token');
  console.log('getAuthToken called, token:', token ? 'exists' : 'missing');
  return token;
};

console.log('Creating axios instance...');
const apiUrl = import.meta.env.VITE_RELICA_ARCHIVIST_API_URL || 'http://localhost:3000';

const httpClient = (url: string, options: any = {}) => {
  const token = getAuthToken();
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return fetchJson(url, options);
};

const dataProvider = {
  // get a list of records based on sort, filter, and pagination
  getList: (resource: string, params: any): Promise<any> => {
    console.log("ARCHIVIST::GETTING LIST", resource, params);

    switch (resource) {
      case "concept/entities":
        return httpClient(`${apiUrl}/concept/entities?uids=[${params.uids.join(",")}]`)
          .then(({ json }) => ({
            data: json.map((e: any) => ({ ...e, id: e.uid })),
            total: json.length,
          }));
      case "kinds":
        const sort = params.sort
          ? `["${params.sort.field}","${params.sort.order}"]`
          : '["id", "ASC"]';
        const rangeMin =
          params.pagination.page * params.pagination.perPage -
          params.pagination.perPage;
        const rangeMax = params.pagination.page * params.pagination.perPage;
        const range = `[${rangeMin}, ${rangeMax}]`;
        return httpClient(`${apiUrl}/kinds?sort=${sort}&range=${range}&filter={}`)
          .then(({ json }) => ({
            data: json.data.map((e: any) => ({ ...e, id: e.uid })),
            total: json.total,
          }));
      default:
        //return rejected promise
        return Promise.reject("Unknown resource");
    }
  },

  // get a single record by id
  getOne: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 122, name: "hello" } });
  },
  // get a list of records based on an array of ids
  getMany: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 122, name: "hello" } });
  },
  // get the records referenced to another record, e.g. comments for a post
  getManyReference: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 122, name: "hello" } });
  },
  // create a record
  create: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 122, name: "hello" } });
  },
  // update a record based on a patch
  update: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 122, name: "hello" } });
  },
  // update a list of records based on an array of ids and a common patch
  updateMany: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 122, name: "hello" } });
  },
  // delete a record by id
  delete: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 122, name: "hello" } });
  },
  // delete a list of records based on an array of ids
  deleteMany: (resource: string, params: any): Promise<any> => {
    return Promise.resolve({ data: { id: 122, name: "hello" } });
  },
};

export default dataProvider;
