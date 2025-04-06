import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { portalClient } from "../../../io/PortalClient.js";

const RelationKindDetails: React.FC = (data) => {
  const {category,
         "required-kind-of-role-1":reqRole1,
         "required-kind-of-role-2":reqRole2} = data

  const { isLoading:reqRole1IsLoading, error:reqRole1Error, data:reqRole1Data } = useQuery({
    queryKey: ["kindModel", reqRole1],
    queryFn: () =>
      reqRole1
        ? portalClient.retrieveKindModel(reqRole1).then((res) => res)
        : Promise.resolve(null),
  });

  const { isLoading:reqRole2IsLoading, error:reqRole2Error, data:reqRole2Data } = useQuery({
    queryKey: ["kindModel", reqRole2],
    queryFn: () =>
      reqRole2
        ? portalClient.retrieveKindModel(reqRole2).then((res) => res)
        : Promise.resolve(null),
  });

  if (reqRole1IsLoading || reqRole2IsLoading) return <div>Loading...</div>;
  if (reqRole1Error) return <div>Error: {reqRole1Error.message}</div>;
  if (reqRole2Error) return <div>Error: {reqRole2Error.message}</div>;

  console.log("RelationKindDetails", reqRole1Data, reqRole2Data)
  return <div>
    <div>Required Role 1: {reqRole1} - {reqRole1Data.name}</div>
    <div>Required Role 2: {reqRole2} - {reqRole2Data.name}</div>
    </div>;
};

export default RelationKindDetails;
