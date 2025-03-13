import React, { useState, useEffect, useRef } from "react";
import { Layout, useRedirect, useStore } from "react-admin";
import { Drawer, IconButton, Paper, Slide } from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { MyMenu } from "./MyMenu.js";
import { MyAppBar } from "./MyAppBar.js";
import LispREPL from "./LispREPL.js";
import { useStores } from "./context/RootStoreContext.js";
import { ccSocket, portalWs, initializeWebSocket } from "./socket.js";
import { portalClient } from "./io/PortalClient.js";
import { authProvider } from "./providers/AuthProvider.js";
import Chat, { Message } from "./components/Chat/index.js";

import "./style.css";

// const memStore = localStorageStore();

const cats = {
  730044: "Physical Object",
  193671: "Occurrence",
  // xxxxx: "State",
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
  const [chatOpen, setChatOpen] = useState(true);

  const { addFacts, addConcepts, setCategories, categories } = factDataStore;
  // const [isConnected, setIsConnected] = useState(false);

  const [selectedNode, setSelectedNode] = useStore("selectedNode", null);
  const [selectedEdge, setSelectedEdge] = useStore("selectedEdge", null);

  const socketInitialized = React.useRef(false);

  const [messages, setMessages] = React.useState<Message[]>([]);
  /*
    const messages = [
    { role: 'user', content: 'Explain quantum computing in simple terms' },
    { role: 'assistant', content: 'Quantum computing is a new type of computing that relies on the principles of quantum physics. Traditional computers, like the one you might be using right now, use bits to store and process information. These bits can represent either a 0 or a 1. In contrast, quantum computers use quantum bits, or qubits.\n\nUnlike bits, qubits can represent not only a 0 or a 1 but also a superposition of both states simultaneously. This means that a qubit can be in multiple states at once, which allows quantum computers to perform certain calculations much faster and more efficiently' },
    { role: 'user', content: 'What are three great applications of quantum computing?' },
    { role: 'assistant', content: 'Three great applications of quantum computing are: Optimization of complex problems, Drug Discovery and Cryptography.' }
  ];*/

  const toggleRepl = () => {
    setReplOpen(!replOpen);
  };

  const establishCats = async () => {
    if (categories.length > 0) return;

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

  const initializeSocketConnection = async () => {
    return new Promise((resolve, reject) => {
      const onPortalConnect = () => {
        console.log("\\\\ CONNECTED SOCKET> PORTAL");
      };

      const onClientRegistered = (d) => {
        console.log("CLIENT REGISTERED", d);
        if (d.success && d.clientID) {
          console.log("SETTING PORTALSWS CLIENT ID!!!!", d.clientID);
          portalWs.clientId = d.clientID;
          // Clean up the one-time listener
          portalWs.off("system:clientRegistered", onClientRegistered);
          resolve(d.clientID);
        } else {
          reject(new Error("Failed to register client"));
        }
      };

      portalWs.on("connect", onPortalConnect);
      portalWs.on("system:clientRegistered", onClientRegistered);

      const token = localStorage.getItem("access_token");
      if (token) {
        initializeWebSocket(token);
      } else {
        reject(new Error("No access token available"));
      }
    });
  };


    // SOCKET CONNECTION

    const onConnect = () => {
      // setIsConnected(true);
      console.log("//// CONNECTED SOCKET> CC");
    };

    const onDisconnect = () => {
      // setIsConnected(false);
      console.log("//// DISCONNECTED SOCKET> CC");
    };

    // SELECTION

    const onSelectEntity = (d) => {
      setSelectedNode(d.entity_uid);
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

    const onNoneSelected = () => {
      console.log("SELECT NONE");
      setSelectedNode(null);
      setSelectedEdge(null);
      // memStore.setItem("selectedNode", null);
      // memStore.setItem("selectedEdge", null);
    };

    // FACTS

    const onAddFacts = (d) => {
      factDataStore.addFacts(d.facts);
    };

    const onRemFacts = (d) => {
      factDataStore.removeFacts(d.fact_uids);
    };

    // MODELS

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

    // ENTITIES

    const onEntitiesCleared = () => {
      factDataStore.clearFacts();
      // semanticModelStore.clearModels();
      // memStore.setItem("selectedNode", null);
      setSelectedNode(null);
    };

    // MODELLING STATE

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

    const onFinalAnswer = (d) => {
      console.log("FINAL ANSWER");
      console.log(d);
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: d.answer }]);
    }

  useEffect(() => {

    const initializeEnvironment = async () => {
      try {
        // First ensure socket connection and client registration
        if (!socketInitialized.current) {
          await initializeSocketConnection();
          socketInitialized.current = true;
        }

        // Then proceed with environment setup
        await establishCats();
        const foo = await authProvider.getIdentity();
        console.log("vvvv - MUTHERFUCKING IDENTITY vvvv:", foo);

        const env = await portalClient.retrieveEnvironment();
        console.log("vvvv - ENVIRONMENT foo vvvv:", env);
        factDataStore.addFacts(env.facts);

        console.log("NOW WE'RE READY!!!!!!!!!!!!!!!!");
      } catch (error) {
        console.error("Failed to initialize environment:", error);
      }
    };

    initializeEnvironment();

    ccSocket.on("connect", onConnect);
    ccSocket.on("disconnect", onDisconnect);
    ccSocket.on("system:finalAnswer", onFinalAnswer);
    portalWs.on("portal:finalAnswer", onFinalAnswer);

    return () => {
      ccSocket.off("connect", onConnect);
      ccSocket.off("disconnect", onDisconnect);
      ccSocket.off("system:finalAnswer", onFinalAnswer);
      portalWs.off("portal:finalAnswer", onFinalAnswer);
    };
  }, []);

  const onUserInputSubmit = (message: string) => {
    console.log(message);
    setMessages(prevMessages => [...prevMessages, { role: 'user', content: message }]);
    portalWs.send("chatUserInput", { message });
  };

  const replHeight = "40vh"; // Adjust as needed



  return (
    <Layout
      {...props}
      menu={MyMenu}
      appBar={MyAppBar}
      sx={{
        "& .RaLayout-content": {
          paddingRight: chatOpen ? "400px" : 0,
          transition: "padding-right 0.3s ease",
        },
      }}
    >
      {props.children}
      <Drawer
        variant="permanent"
        anchor="right"
        open={chatOpen}
        sx={{
          width: chatOpen ? 400 : 400,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 400,
            position: "fixed",
            height: "calc(100vh - 64px)",
            top: 64,
            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
            transition: "transform 0.3s ease",
            transform: chatOpen ? "translateX(0)" : "translateX(380px)",
          },
        }}
      >
        <IconButton
          onClick={() => setChatOpen(!chatOpen)}
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "24px",
            borderRadius: 0,
            borderRight: "1px solid rgba(0, 0, 0, 0.12)",
            backgroundColor: "background.paper",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          {chatOpen ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
        <Paper
          elevation={0}
          sx={{
            ml: 3,
            height: "100%",
            p: 2,
          }}
        >
          <div
            style={{
              height: "calc(100% - 40px)",
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              borderRadius: 1,
              padding: 2,
            }}
          >
            <Chat messages={messages} onSubmit={onUserInputSubmit} />
          </div>
        </Paper>
      </Drawer>
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
    </Layout>
  );
};
