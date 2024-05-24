import React, { useEffect, useState, memo, useCallback } from "react";
import GraphView from "@relica/3d-graph-ui";
import useRootStoreContext from "../hooks/useRootStoreContext";
import { observer } from "mobx-react";
import { toJS } from "mobx";
import ErrorBoundary from "./ErrorBoundary";

export interface GraphContainerProps {}

const GraphContainer: React.FC<GraphContainerProps> = observer(() => {
  const { factDataStore, graphViewStore, colorPaletteStore } =
    useRootStoreContext();
  // const { nodeData, edgeData } = graphDataStore;
  const { facts, categories } = factDataStore;
  const { selectNode, selectedNode, handleContextMenuTrigger } = graphViewStore;
  const { paletteMap } = colorPaletteStore;

  const handleEdgeRollOver = (uid: number) => {
    const fact = factDataStore.facts.find((fact) => fact.fact_uid === uid);
    const uid2 = fact?.rel_type_uid;
    graphViewStore.hoveredLinkType = uid2;
  };

  const handleEdgeRollOut = useCallback((uid: number) => {
    graphViewStore.hoveredLinkType = null;
  }, []);

  const jsCats = toJS(categories);
  console.log("~~~~~~~~~~~ WHAT IS GOING ON HERE!!!! ~~~~~~~~~~");
  console.log(jsCats);
  console.log(toJS(facts));
  console.log(selectNode);
  console.log(handleContextMenuTrigger);
  console.log(graphViewStore.selectNone);
  console.log(handleEdgeRollOver);
  console.log(handleEdgeRollOut);
  console.log(selectedNode);
  console.log(paletteMap);
  console.log("~~~~~~~~~~~ END WHAT IS GOING ON HERE!!!! ~~~~~~~~~~");
  return (
    <ErrorBoundary>
      {jsCats.length > 0 && (
        <GraphView
          categories={toJS(categories)}
          facts={toJS(facts)} // nodeData={nodeData}
          // edgeData={edgeData}
          onNodeClick={selectNode}
          onNodeRightClick={handleContextMenuTrigger}
          onStageClick={graphViewStore.selectNone}
          onEdgeRollOver={handleEdgeRollOver}
          onEdgeRollOut={handleEdgeRollOut}
          selectedNode={selectedNode}
          paletteMap={paletteMap}
        />
      )}
    </ErrorBoundary>
  );
});

export default GraphContainer;
