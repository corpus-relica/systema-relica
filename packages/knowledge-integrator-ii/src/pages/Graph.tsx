import React, { useEffect, useState, memo, useCallback } from "react";
import GraphView from "@relica/3d-graph-ui";
import { useStore, useDataProvider } from "react-admin";
import { nodeData, edgeData } from "../types";

const cats = {
  730044: "Physical Object",
  193671: "Occurrence",
  160170: "Role",
  790229: "Aspect",
  //970002: "Information",
  2850: "Relation",
};

const Graph = () => {
  const dataProvider = useDataProvider();
  const [categories, setCategories] = useStore("categories", []);
  const [facts, setFacts] = useStore("facts", []);
  const [selectedNode, setSelectedNode] = useStore("selectedNode", null);
  const [selectedEdge, setSelectedEdge] = useStore("selectedEdge", null);
  const [paletteMap, setPaletteMap] = useStore("paletteMap", new Map());

  // const establishCats = async () => {
  //   const concepts = await resolveUIDs(
  //     Object.keys(cats).map((x) => parseInt(x)),
  //   );
  //   console.log("vvvv - CONCEPTS vvvv:");
  //   console.log(concepts);
  //   const newCats = [];
  //   for (const [key, name] of Object.entries(cats)) {
  //     const concept = concepts.find((c) => c.uid === parseInt(key));
  //     const { uid, descendants } = concept;
  //     newCats.push({ uid, name, descendants });
  //   }
  //   console.log("vvvv - CATEGORIES vvvv:");
  //   console.log(newCats);
  //   setCategories(newCats);
  // };

  useEffect(() => {
    console.log("vvvv - CATEGORIES vvvv:");
    const init = async () => {
      const concepts = await dataProvider.getList("db/concept/entities", {
        uids: Object.keys(cats).map((x) => parseInt(x)),
      });
      const newCats = [];
      for (const [key, name] of Object.entries(cats)) {
        const concept = concepts.data.find((c) => c.uid === parseInt(key));
        const { uid, descendants } = concept;
        newCats.push({ uid, name, descendants });
      }
      setCategories(newCats);
    };
    //
    // dataProvider
    //   .getList("env/facts", {})
    //   .then(({ data }) => {
    //     console.log("ENV FACTS");
    //     console.log(data);
    //     setFacts(data);
    //     // setUser(data);
    //     // setLoading(false);
    //   })
    //   .catch((error) => {
    //     // setError(error);
    //     // setLoading(false);
    //   });
    init();
  }, []);

  const selectNode = (id: number) => {
    // sockSendCC("user", "selectEntity", { uid: id });
  };

  const handleNodeHover = (node: nodeData | null) => {
    // this.hoveredNode = node?.id || null;
  };

  const handleLinkHover = (link: edgeData | null) => {
    // this.hoveredLink = link?.id || null;
  };

  const handleContextMenuTrigger = (
    uid: number,
    type: string,
    event: MouseEvent
  ) => {
    // const x = event.clientX;
    // const y = event.clientY;
    // this.contextMenuFocus = { x, y, uid, type };
  };

  //

  const handleEdgeRollOver = (uid: number) => {
    // const fact = factDataStore.facts.find((fact) => fact.fact_uid === uid);
    // const uid2 = fact?.rel_type_uid;
    // graphViewStore.hoveredLinkType = uid2;
  };

  const handleEdgeRollOut = useCallback((uid: number) => {
    // graphViewStore.hoveredLinkType = null;
  }, []);

  const handleEdgeClick = (uid: any) => {
    // console.log("GRAPHCONTAINER:HANDLE EDGE CLICK", uid);
    // selectEdge(uid);
  };

  const onStageClick = () => {
    // graphViewStore.selectNone();
  };
  console.log("~~~~~~~~~~~ WHAT IS GOING ON HERE!!!! ~~~~~~~~~~");
  // console.log(facts);
  return (
    <div style={{ height: "100%" }}>
      <h1>Graph</h1>
      <div style={{ width: "100vw", height: "100vh" }}>
        <GraphView
          categories={categories}
          facts={facts} // nodeData={nodeData}
          // edgeData={edgeData}
          onNodeClick={selectNode}
          onNodeRightClick={(uid: number, event: MouseEvent) => {
            // handleContextMenuTrigger(uid, "entity", event);
          }}
          onStageClick={onStageClick}
          onEdgeRollOver={handleEdgeRollOver}
          onEdgeRollOut={handleEdgeRollOut}
          onEdgeClick={handleEdgeClick}
          onEdgeRightClick={(uid: number, event: MouseEvent) => {
            // handleContextMenuTrigger(uid, "fact", event);
          }}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          paletteMap={paletteMap}
        />
      </div>
    </div>
  );
};

export default Graph;
