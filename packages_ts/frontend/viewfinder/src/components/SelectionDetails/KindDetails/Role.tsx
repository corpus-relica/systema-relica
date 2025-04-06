import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { portalClient } from "../../../io/PortalClient.js";

const RoleKindDetails: React.FC = (data) => {
  const {
    category,
    "possible-kinds-of-role-players": possRolePlayers,
    "requiring-kinds-of-relations": reqRels
  } = data;

  // Query for possible role players (array of UIDs)
  const possRolePlayersQueries = useQuery({
    queryKey: ["kindModels", possRolePlayers],
    queryFn: () =>
      possRolePlayers && possRolePlayers.length > 0
        ? Promise.all(
            possRolePlayers.map((uid) =>
              portalClient.retrieveKindModel(uid).then((res) => ({
                uid,
                ...res
              }))
            )
          )
        : Promise.resolve([]),
    enabled: !!possRolePlayers && possRolePlayers.length > 0
  });

  // Query for requiring relations (array of UIDs)
  const reqRelsQueries = useQuery({
    queryKey: ["kindModels", reqRels],
    queryFn: () =>
      reqRels && reqRels.length > 0
        ? Promise.all(
            reqRels.map((uid) =>
              portalClient.retrieveKindModel(uid).then((res) => ({
                uid,
                ...res
              }))
            )
          )
        : Promise.resolve([]),
    enabled: !!reqRels && reqRels.length > 0
  });

  if (possRolePlayersQueries.isLoading || reqRelsQueries.isLoading) return <div>Loading...</div>;
  if (possRolePlayersQueries.error) return <div>Error: {possRolePlayersQueries.error.message}</div>;
  if (reqRelsQueries.error) return <div>Error: {reqRelsQueries.error.message}</div>;

  const possRolePlayersData = possRolePlayersQueries.data || [];
  const reqRelsData = reqRelsQueries.data || [];

  console.log("RoleKindDetails", possRolePlayersData, reqRelsData);
  
  return (
    <div>
      <div>
        <h4>Possible Kinds of Role Players:</h4>
        {possRolePlayersData.length > 0 ? (
          <ul>
            {possRolePlayersData.map((item) => (
              <li key={item.uid}>
                {item.uid} - {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <div>None</div>
        )}
      </div>
      <div>
        <h4>Requiring Kinds of Relations:</h4>
        {reqRelsData.length > 0 ? (
          <ul>
            {reqRelsData.map((item) => (
              <li key={item.uid}>
                {item.uid} - {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <div>None</div>
        )}
      </div>
    </div>
  );
};

export default RoleKindDetails;
