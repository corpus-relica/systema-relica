import React, { useState, useEffect } from "react";
import { Layout, useRedirect, useStore } from "react-admin";
import { Slide, IconButton } from "@mui/material";
import { ExpandLess, ExpandMore, Chat as ChatIcon } from "@mui/icons-material";
import { observer } from "mobx-react";
import { MyMenu } from "./MyMenu";
import { MyAppBar } from "./MyAppBar";
import LispREPL from "./LispREPL";
import Chat from "./components/Chat";
import { useStores } from "./context/RootStoreContext";
import { authProvider } from "./authProvider";
import { loadUserEnvironment, resolveUIDs } from "./PortalClient";
import { PortalSystemEvents } from "@relica/websocket-contracts";

const replHeight = "40vh"; // Adjust as needed
const chatHeight = "50vh"; // Adjust as needed

// import { portalWs, initializeWebSocket } from "./socket.js";
import { portalSocket } from "./PortalSocket";

// const memStore = localStorageStore();

const cats = {
  730044: "Physical Object",
  193671: "Occurrence",
  160170: "Role",
  790229: "Aspect",
  //970002: "Information",
  2850: "Relation",
};

export const MyLayout = observer((props: any) => {
  const redirect = useRedirect();
  const rootStore: any = useStores();

  console.log("vvvv - ROOT STORE vvvv:");
  console.log(rootStore);
  const { factDataStore, authStore, nousDataStore } = rootStore;

  const [replOpen, setReplOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { addFacts, addConcepts, setCategories } = factDataStore;
  const [isConnected, setIsConnected] = useState(false);

  const [selectedNode, setSelectedNode] = useStore("selectedNode", null);
  const [selectedEdge, setSelectedEdge] = useStore("selectedEdge", null);

  const toggleRepl = () => {
    setReplOpen(!replOpen);
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  const sendChatMessage = async (message: string) => {
    // Add user message to store
    nousDataStore.addMessage("user", message);

    // Get user identity for the chat message
    try {
      const identity = await authProvider.getIdentity?.();
      const userId = identity?.id;
      const environmentId = rootStore.environmentId;

      // Send message via portal socket
      const foo = await portalSocket.emit("user", "chatUserInput", {
        message,
        userId,
        environmentId,
      });
    } catch (error) {
      console.error("Failed to send chat message:", error);
    }
  };

  // const establishCats = async () => {
  //   if (categories.length > 0) return;

  //   console.log("vvvv - VULNERABLE II - vvvv");
  //   const result = await portalClient.resolveUIDs(
  //     Object.keys(cats).map((x) => parseInt(x))
  //   );
  //   console.log("vvvv - CONCEPTS vvvv:");
  //   console.log(result.data);
  //   const newCats = [];
  //   for (const [key, name] of Object.entries(cats)) {
  //     const concept = result.data.find((c: any) => c.uid === parseInt(key));
  //     const { uid, descendants } = concept;
  //     newCats.push({ uid, name, descendants });
  //   }
  //   console.log("vvvv - CATEGORIES vvvv:");
  //   console.log(newCats);
  //   setCategories(newCats);
  // };

  const establishCats = async () => {
    // getting the list of uids for the subtypes of the major categories
    // mostly for node coloring in the graph later on
    const concepts = await resolveUIDs(
      Object.keys(cats).map((x) => parseInt(x))
    );

    const newCats = [];
    for (const [key, name] of Object.entries(cats)) {
      const concept = concepts.find((c: any) => c.uid === parseInt(key));
      const { uid, descendants } = concept;
      newCats.push({ uid, name, descendants });
    }
    setCategories(newCats);
  };

  // const initializeSocketConnection = async () => {
  //   return new Promise((resolve, reject) => {
  //     const onPortalConnect = () => {
  //       console.log("\\\\ CONNECTED SOCKET> PORTAL");
  //     };

  //     const onClientRegistered = (d) => {
  //       if (d.clientID) {
  //         portalWs.clientId = d.clientID;
  //         // Clean up the one-time listener
  //         portalWs.off("system:clientRegistered", onClientRegistered);
  //         resolve(d.clientID);
  //       } else {
  //         reject(new Error("Failed to register client"));
  //       }
  //     };

  //     portalWs.on("connect", onPortalConnect);
  //     portalWs.on("system:clientRegistered", onClientRegistered);

  //     const token = localStorage.getItem("access_token");
  //     if (token) {
  //       initializeWebSocket(token);
  //     } else {
  //       reject(new Error("No access token available"));
  //     }
  //   });
  // };

  useEffect(() => {
    console.log("vvvv - MY LAYOUT vvvv:");

    const onConnect = () => {
      setIsConnected(true);
      // console.log("🔌Connected to portal socket");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      // console.log("🔌 Disconnected from portal socket");
    };

    const onSelectEntity = (d) => {
      setSelectedNode(d.uid);
      setSelectedEdge(null);
      // memStore.setItem("selectedNode", d.uid); //
      // memStore.setItem("selectedEdge", null);
    };

    const onSelectFact = (d) => {
      setSelectedNode(null);
      setSelectedEdge(d.uid);
      // memStore.setItem("selectedNode", null);
      // memStore.setItem("selectedEdge", d.uid);
    };

    const onAddFacts = (d) => {
      console.log("Adding facts:", d.facts);
      factDataStore.addFacts(d.facts);
    };

    const onRemFacts = (d) => {
      factDataStore.removeFacts(d.factUids);
    };

    const onAddModels = (d) => {
      d.models.forEach((model: any) => {
        const key = "model:" + model.uid;
        // memStore.removeItem(key);
        // memStore.setItem(key, model);
      });
    };

    const onRemModels = (d) => {
      d.model_uids.forEach((uid: number) => {
        const key = "model:" + uid;
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
      setSelectedNode(null);
      setSelectedEdge(null);
      // memStore.setItem("selectedNode", null);
      // memStore.setItem("selectedEdge", null);
    };

    const onStateInitialized = (state: any) => {
      if (state.mainstate === "REVIEW") {
        redirect("/env/graph");
      } else if (state.mainstate === "MODELLING") {
        redirect("/modelling");
      }
    };

    const onStateChange = (state: any) => {
      if (state.mainstate === "REVIEW") {
        redirect("/env/graph");
      } else if (state.mainstate === "MODELLING") {
        redirect("/modelling");
      }
    };

    const onFinalAnswer = (d: any) => {
      console.log("FINAL ANSWER");
      console.log(d.response);
      nousDataStore.addMessage("assistant", d.response);
    };

    const initializeEnvironment = async () => {
      try {
        // First ensure socket connection and client registration
        // if (!socketInitialized.current) {
        //   await initializeSocketConnection();
        //   socketInitialized.current = true;
        // }

        // Then proceed with environment setup
        await establishCats();
        const foo = await authProvider.getIdentity();
        console.log(
          "vvvv - MUTHERFUCKING IDENTITY vvvv:",
          foo,
          authStore.userId
        );
        console.log("vvvv - USER ID vvvv:");

        const env = await loadUserEnvironment(foo.id as number);
        console.log("vvvv - ENVIRONMENT foo vvvv:", env);
        factDataStore.addFacts(env.facts);
        rootStore.environmentId = env.id;

        console.log("NOW WE'RE READY!!!!!!!!!!!!!!!!");
      } catch (error) {
        console.error("Failed to initialize environment:", error);
      }
    };

    initializeEnvironment();

    portalSocket.on("connect", onConnect);
    portalSocket.on("disconnect", onDisconnect);

    portalSocket.on(PortalSystemEvents.SELECTED_ENTITY, onSelectEntity);
    // ccSocket.on("system:selectedFact", onSelectFact);
    portalSocket.on(PortalSystemEvents.SELECTED_NONE, onNoneSelected);
    portalSocket.on(PortalSystemEvents.LOADED_FACTS, onAddFacts);
    portalSocket.on(PortalSystemEvents.UNLOADED_FACTS, onRemFacts);
    portalSocket.on(PortalSystemEvents.NOUS_CHAT_RESPONSE, onFinalAnswer);
    // ccSocket.on("system:loadedModels", onAddModels);
    // ccSocket.on("system:unloadedModels", onRemModels);
    // ccSocket.on("system:updateCategoryDescendantsCache", establishCats);
    // ccSocket.on("system:entitiesCleared", onEntitiesCleared);

    // ccSocket.on("system:stateInitialized", onStateInitialized);
    // ccSocket.on("system:stateChanged", onStateChange);

    return () => {
      portalSocket.off("connect", onConnect);
      portalSocket.off("disconnect", onDisconnect);
      portalSocket.off(PortalSystemEvents.SELECTED_ENTITY, onSelectEntity);
      portalSocket.off(PortalSystemEvents.SELECTED_NONE, onNoneSelected);
      portalSocket.off(PortalSystemEvents.LOADED_FACTS, onAddFacts);
      portalSocket.off(PortalSystemEvents.UNLOADED_FACTS, onRemFacts);
      portalSocket.off(PortalSystemEvents.NOUS_CHAT_RESPONSE, onFinalAnswer);
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

        {/* Chat Panel */}
        <Slide direction="left" in={chatOpen} mountOnEnter unmountOnExit>
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "400px",
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(5px)",
              display: "flex",
              flexDirection: "column",
              zIndex: 1300,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 16px",
                color: "white",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <span>NOUS Chat</span>
              <IconButton onClick={toggleChat} color="inherit">
                <ExpandMore />
              </IconButton>
            </div>
            <div style={{ flexGrow: 1, overflow: "hidden", padding: "8px" }}>
              <Chat
                messages={nousDataStore.messages}
                onSubmit={sendChatMessage}
              />
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

        {/* Chat Toggle Button */}
        <IconButton
          color="primary"
          aria-label="open chat"
          onClick={toggleChat}
          sx={{
            position: "fixed",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1301,
            backgroundColor: (theme) => theme.palette.background.paper,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
          }}
        >
          <ChatIcon />
        </IconButton>
      </div>
    </Layout>
  );
});
