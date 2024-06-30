import React, { useState, useEffect } from "react";
import { useStore } from "react-admin";

const SelectionDetails = () => {
  const [selectedNode] = useStore("selectedNode");
  const [selectedEdge] = useStore("selectedEdge");

  useEffect(() => {
    // if (selectedNode) {
    //   setNode(selectedNode);
    // }
    console.log("FOO", selectedNode);
  }, [selectedNode]);

  return (
    <>
      <h1>Selection Details</h1>
      {selectedNode}
      {selectedEdge}
    </>
  );
};

export default SelectionDetails;
