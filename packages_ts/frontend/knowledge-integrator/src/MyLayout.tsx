import React, { useState, useEffect } from "react";
import { Layout, useRedirect, useStore } from "react-admin";
import { Slide, IconButton } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { MyMenu } from "./MyMenu";
import { MyAppBar } from "./MyAppBar";
import LispREPL from "./LispREPL";
import { useStores } from "./context/RootStoreContext";

const replHeight = "40vh"; // Adjust as needed

import { ccSocket } from "./socket";

// const memStore = localStorageStore();

export const MyLayout = (props) => {
  const redirect = useRedirect();
  const rootStore: any = useStores();

  console.log("vvvv - ROOT STORAGE vvvv:");
  console.log(rootStore);
  const { factDataStore } = rootStore;

  const [replOpen, setReplOpen] = useState(false);

  const { addFacts, addConcepts, setCategories } = factDataStore;
  const [isConnected, setIsConnected] = useState(false);

  const [selectedNode, setSelectedNode] = useStore("selectedNode", null);
  const [selectedEdge, setSelectedEdge] = useStore("selectedEdge", null);

  const toggleRepl = () => {
    setReplOpen(!replOpen);
  };

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log("//// CONNECTED SOCKET> CC");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("//// DISCONNECTED SOCKET> CC");
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
