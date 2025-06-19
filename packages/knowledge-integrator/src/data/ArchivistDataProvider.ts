import { fetchUtils } from 'react-admin';
import { getAuthToken } from '../authProvider';

const { fetchJson } = fetchUtils;

// Add a function to get the token from localStorage


console.log('Creating ArchivistDataProvider with Portal routing...');
const portalApiUrl = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:2204';

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
  // get a list of records based on sort, filter, and pagination
  getList: (resource: string, params: any): Promise<any> => {
    console.log("ARCHIVIST::GETTING LIST via Portal", resource, params);

    switch (resource) {
      case "concept/entities":
        // Use Portal's concept/entities endpoint
        const uidsParam = params.uids ? params.uids.join(",") : "";
        return httpClient(`${portalApiUrl}/concept/entities?uids=${uidsParam}`)
          .then(({ json }) => {
            if (json.success && json.entities) {
              return {
                data: json.entities.map((e: any) => ({ ...e, id: e.uid })),
                total: json.entities.length,
              };
            }
            throw new Error(json.error || 'Failed to fetch entities');
          });
      case "kinds":
        // Use Portal's new kinds endpoint with proper pagination
        const { page = 1, perPage = 10 } = params.pagination || {};
        const { field = 'lh_object_name', order = 'ASC' } = params.sort || {};
        
        // Transform React Admin format to Portal API format
        const sortParam = JSON.stringify([field, order]);
        const rangeParam = JSON.stringify([(page - 1) * perPage, perPage]);
        const filterParam = JSON.stringify(params.filter || {});
        
        const queryParams = new URLSearchParams({
          sort: sortParam,
          range: rangeParam,
          filter: filterParam
        });

        return httpClient(`${portalApiUrl}/kinds?${queryParams.toString()}`)
          .then(({ json }) => {
            console.log("Portal kinds response:", json);
            if (json.success && json.kinds) {
              const kindsData = json.kinds.data || [];
              const total = json.kinds.total || 0;
              
              return {
                data: kindsData.map((e: any) => ({ 
                  ...e, 
                  id: e.uid || e.id || Math.random().toString(36) 
                })),
                total: total,
              };
            }
            throw new Error(json.error || 'Failed to fetch kinds');
          })
          .catch(error => {
            console.error("Error fetching kinds:", error);
            // Return empty data set on error for MVP
            return { data: [], total: 0 };
          })
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
