import React, { useState, useEffect } from "react";
import { Layout, useRedirect, useStore } from "react-admin";
import { Slide, IconButton } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { MyMenu } from "./MyMenu.js";
import { MyAppBar } from "./MyAppBar.js";
import LispREPL from "./LispREPL.js";
import { useStores } from "./context/RootStoreContext.js";

const replHeight = "40vh"; // Adjust as needed

import { ccSocket, portalWs, initializeWebSocket } from "./socket.js";

import { portalClient } from "./io/PortalClient.js";
import { authProvider } from "./providers/AuthProvider.js";

// const memStore = localStorageStore();

const cats = {
  730044: "Physical Object",
  193671: "Occurrence",
  160170: "Role",
  790229: "Aspect",
  //970002: "Information",
  2850: "Relation",
};

export const MyLayout = (props) => {
  const redirect = useRedirect();
  const rootStore: any = useStores();

  console.log("vvvv - ROOT STORAGE vvvv:");
  console.log(rootStore);
  const { factDataStore } = rootStore;

  const [replOpen, setReplOpen] = useState(false);

  const { addFacts, addConcepts, setCategories } = factDataStore;
  // const [isConnected, setIsConnected] = useState(false);

  const [selectedNode, setSelectedNode] = useStore("selectedNode", null);
  const [selectedEdge, setSelectedEdge] = useStore("selectedEdge", null);

  const toggleRepl = () => {
    setReplOpen(!replOpen);
  };

  const establishCats = async () => {
    console.log("vvvv - VULNERABLE II - vvvv");
    const concepts = await portalClient.resolveUIDs(
      Object.keys(cats).map((x) => parseInt(x))
    );
    console.log("vvvv - CONCEPTS vvvv:");
    console.log(concepts);
    const newCats = [];
    for (const [key, name] of Object.entries(cats)) {
      const concept = concepts.find((c: any) => c.uid === parseInt(key));
      const { uid, descendants } = concept;
      newCats.push({ uid, name, descendants });
    }
    console.log("vvvv - CATEGORIES vvvv:");
    console.log(newCats);
    setCategories(newCats);
  };

  useEffect(() => {
    const retrieveEnv = async () => {
      const foo = await authProvider.getIdentity();
      console.log("vvvv - MUTHERFUCKING IDENTITY vvvv:");
      console.log(foo);
      const env = await portalClient.retrieveEnvironment();
      console.log("vvvv - ENVIRONMENT foo vvvv:");
      console.log(env);
      factDataStore.addFacts(env.facts);
      // semanticModelStore.addModels(env.models);
      // graphViewStore.selectedNode = env.selected_entity_id;
    };

    const foobarbaz = async () => {
      await establishCats();
      await retrieveEnv();
      console.log("NOW WE'RE READY!!!!!!!!!!!!!!!!");
    };

    foobarbaz();
  }, []);

  useEffect(() => {
    const onConnect = () => {
      // setIsConnected(true);
      console.log("//// CONNECTED SOCKET> CC");
    };

    const onPortalConnect = () => {
      console.log("\\\\ CONNECTED SOCKET> PORTAL");
    };

    const onDisconnect = () => {
      // setIsConnected(false);
      console.log("//// DISCONNECTED SOCKET> CC");
    };

    const onPortalDisconnect = () => {
      console.log("\\\\ DISCONNECTED SOCKET> PORTAL");
    };

    const onSelectEntity = (d) => {
      console.log("SELECT ENTITY");
      console.log(d.uid);
      setSelectedNode(d.uid);
      setSelectedEdge(null);
      // memStore.setItem("selectedNode", d.uid); //
      // memStore.setItem("selectedEdge", null);
    };

    const onSelectFact = (d) => {
      console.log("SELECT FACT");
      console.log(d.uid);
      setSelectedNode(null);
      setSelectedEdge(d.uid);
      // memStore.setItem("selectedNode", null);
      // memStore.setItem("selectedEdge", d.uid);
    };

    const onAddFacts = (d) => {
      factDataStore.addFacts(d.facts);
    };

    const onRemFacts = (d) => {
      factDataStore.removeFacts(d.fact_uids);
    };

    const onAddModels = (d) => {
      d.models.forEach((model: any) => {
        const key = "model:" + model.uid;
        console.log("WHAT THE FUCK IS HAPPENING HERE!!", key);
        // memStore.removeItem(key);
        // memStore.setItem(key, model);
      });
    };

    const onRemModels = (d) => {
      d.model_uids.forEach((uid: number) => {
        const key = "model:" + uid;
        console.log("AND HERE!!", key);
        // memStore.removeItem(key);
      });
    };

    const onEntitiesCleared = () => {
      factDataStore.clearFacts();
      // semanticModelStore.clearModels();
      // memStore.setItem("selectedNode", null);
      setSelectedNode(null);
    };

    const onNoneSelected = () => {
      console.log("SELECT NONE");
      setSelectedNode(null);
      setSelectedEdge(null);
      // memStore.setItem("selectedNode", null);
      // memStore.setItem("selectedEdge", null);
    };

    const onStateInitialized = (state: any) => {
      console.log("STATE INITIALIZED");
      console.log(state);
      if (state.mainstate === "REVIEW") {
        console.log("REVIEW MODE");
        redirect("/env/graph");
      } else if (state.mainstate === "MODELLING") {
        console.log("MODELLING MODE");
        redirect("/modelling");
      }
    };

    const onStateChange = (state: any) => {
      console.log("STATE CHANGED");
      console.log(state);
      if (state.mainstate === "REVIEW") {
        console.log("REVIEW MODE");
        redirect("/env/graph");
      } else if (state.mainstate === "MODELLING") {
        console.log("MODELLING MODE");
        redirect("/modelling");
      }
    };

    ccSocket.on("connect", onConnect);
    ccSocket.on("disconnect", onDisconnect);

    ccSocket.on("system:selectedEntity", onSelectEntity);
    ccSocket.on("system:selectedFact", onSelectFact);
    ccSocket.on("system:selectedNone", onNoneSelected);
    ccSocket.on("system:loadedFacts", onAddFacts);
    ccSocket.on("system:unloadedFacts", onRemFacts);
    ccSocket.on("system:loadedModels", onAddModels);
    ccSocket.on("system:unloadedModels", onRemModels);
    // ccSocket.on("system:updateCategoryDescendantsCache", establishCats);
    ccSocket.on("system:entitiesCleared", onEntitiesCleared);

    ccSocket.on("system:stateInitialized", onStateInitialized);
    ccSocket.on("system:stateChanged", onStateChange);

    // ------------------------------------------------------------- //

    portalWs.on("connect", onPortalConnect);
    portalWs.on("disconnect", onPortalDisconnect);

    portalWs.on("system:loadedFacts", onAddFacts);

    const token = localStorage.getItem("access_token");
    if (token) {
      initializeWebSocket(token);
    }

    return () => {
      ccSocket.off("connect", onConnect);
      ccSocket.off("disconnect", onDisconnect);

      ccSocket.off("system:selectedEntity", onSelectEntity);
      ccSocket.off("system:selectedFact", onSelectFact);
      ccSocket.off("system:selectedNone", onNoneSelected);
      ccSocket.off("system:loadedFacts", onAddFacts);
      ccSocket.off("system:unloadedFacts", onRemFacts);
      // ccSocket.off("system:updateCategoryDescendantsCache", establishCats);
      ccSocket.off("system:entitiesCleared", onEntitiesCleared);
      ccSocket.off("system:loadedModels", onAddModels);
      ccSocket.off("system:unloadedModels", onRemModels);

      ccSocket.off("system:stateInitialized", onStateInitialized);
      ccSocket.off("system:stateChanged", onStateChange);

      // ------------------------------------------------------------- //

      portalWs.off("connect", onPortalConnect);
      portalWs.off("disconnect", onPortalDisconnect);

      portalWs.off("system:loadedFacts", onAddFacts);
    };
  }, []);

  return (
    <Layout {...props} appBar={MyAppBar} menu={MyMenu}>
      <div
        style={{
          position: "relative",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {props.children}
        <Slide direction="up" in={replOpen} mountOnEnter unmountOnExit>
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: replHeight,
              backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent background
              backdropFilter: "blur(5px)", // Adds a blur effect to the background
              display: "flex",
              flexDirection: "column",
              zIndex: 1300, // Ensure it's above other content
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px",
                color: "white",
              }}
            >
              <span>Lisp REPL</span>
              <IconButton onClick={toggleRepl} color="inherit">
                <ExpandMore />
              </IconButton>
            </div>
            <div style={{ flexGrow: 1, overflow: "auto" }}>
              <LispREPL />
            </div>
          </div>
        </Slide>
        <IconButton
          color="primary"
          aria-label="open repl"
          onClick={toggleRepl}
          sx={{
            position: "fixed",
            left: "50%",
            bottom: replOpen ? replHeight : 0,
            transform: "translateX(-50%)",
            zIndex: 1301,
            backgroundColor: (theme) => theme.palette.background.paper,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
          }}
        >
          {replOpen ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </div>
    </Layout>
  );
};
