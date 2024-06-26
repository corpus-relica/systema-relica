import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_RELICA_ARCHIVIST_API_URL,
});

const dataProvider = {
  // get a list of records based on sort, filter, and pagination
  getList: (resource: string, params: any): Promise<any> => {
    console.log("ARCHIVIST::GETTING LIST", resource, params);

    switch (resource) {
      case "concept/entities":
        return axiosInstance
          .get("/concept/entities", {
            params: { uids: "[" + params.uids.join(",") + "]" },
          })
          .then((response) => {
            response.data.forEach((e: any) => {
              e.id = e.uid;
            });
            return {
              data: response.data,
              total: response.data.length,
            };
          });
      case "kinds":
        const sort = params.sort
          ? `["${params.sort.field}","${params.sort.order}"]`
          : '["id", "ASC"]';
        const rangeMin =
          params.pagination.page * params.pagination.perPage -
          params.pagination.perPage;
        const rangeMax = params.pagination.page * params.pagination.perPage;
        const range = `[${rangeMin}, ${rangeMax}]`;
        return axiosInstance
          .get("kinds", {
            params: {
              sort: sort,
              range: range,
              filter: "{}",
            },
          })
          .then((response) => {
            console.log("KINDS", response);
            response.data.data.forEach((e: any) => {
              e.id = e.uid;
            });

            return {
              data: response.data.data,
              total: response.data.total,
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
