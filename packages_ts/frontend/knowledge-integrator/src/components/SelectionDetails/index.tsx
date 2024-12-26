import React, { useState, useEffect } from "react";
import { useStore } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import { getEntityType } from "../../RLCBaseClient";
import KindDetails from "./KindDetails";
import IndividualDetails from "./IndividualDetails";

const START_INT_UID_RANGE = 5000000000;

const SelectionDetails = () => {
  const [selectedNode] = useStore("selectedNode");
  const [selectedEdge] = useStore("selectedEdge");

  const { isLoading, error, data } = useQuery({
    queryKey: ["entityType", selectedNode],
    queryFn: () =>
      selectedNode
        ? getEntityType(selectedNode).then((res) => res)
        : Promise.resolve(null),
    enabled: !!selectedNode && selectedNode < START_INT_UID_RANGE, // This disables the query if selectedNode is null
  });

  if (!selectedNode) return <div>No entity selected</div>;
  if (isLoading) return <div>Loading...</div>;
  // if (isLoading || !selectedNode) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  let comp;
  if (selectedNode >= START_INT_UID_RANGE) {
    comp = <div>Integer:{selectedNode}</div>; //<IntegerDetails />;
  } else if (data && (data === "kind" || data === "qualification")) {
    comp = <KindDetails />;
  } else if (data && data === "individual") {
    comp = <IndividualDetails />;
  } else {
    comp = <div>Unknown entity type</div>;
    console.log("Unknown entity type");
    console.log(data);
  }

  return comp;
};

export default SelectionDetails;
