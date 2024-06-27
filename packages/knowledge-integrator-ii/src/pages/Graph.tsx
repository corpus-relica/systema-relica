import React, {
  useEffect,
  useState,
  memo,
  useCallback,
  useRef,
  useReducer,
} from "react";

import GraphView from "@relica/3d-graph-ui";

import { useStore, useDataProvider } from "react-admin";
import { nodeData, edgeData } from "../types";
import GraphContextMenu from "../components/GraphContextMenu";

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

  // START MENU

  const [open, setOpen] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [uid, setUid] = useState(0);
  const [type, setType] = useState("");

  const handleContextMenuTrigger = (
    uid: number,
    type: string,
    event: MouseEvent
  ) => {
    event.preventDefault();
    setX(event.clientX);
    setY(event.clientY);
    setUid(uid);
    setType(type);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // END MENU

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
    setOpen(false);
  };

  return (
    <div style={{ height: "100%" }}>
      <h1>Graph</h1>
      <GraphContextMenu
        open={open}
        handleClose={handleClose}
        x={x}
        y={y}
        uid={uid}
        type={type}
      />
      <div style={{ width: "100vw", height: "100vh" }}>
        <GraphView
          categories={categories}
          facts={facts}
          onNodeClick={selectNode}
          onNodeRightClick={(uid: number, event: MouseEvent) => {
            handleContextMenuTrigger(uid, "entity", event);
          }}
          onStageClick={onStageClick}
          onEdgeRollOver={handleEdgeRollOver}
          onEdgeRollOut={handleEdgeRollOut}
          onEdgeClick={handleEdgeClick}
          onEdgeRightClick={(uid: number, event: MouseEvent) => {
            handleContextMenuTrigger(uid, "fact", event);
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
