import React, { useEffect, useState, useContext } from "react";
import { Box, Grid, Grommet, Stack, Text, Tabs, Tab } from "grommet";
import Header from "./components/Header";
import GraphContainer from "./components/GraphContainer";
import SelectionDetails from "./components/SelectionDetails";
import InsertTab from "./components/InsertTab";
import ReviewTab from "./components/ReviewTab";
import ErrorBoundary from "./components/ErrorBoundary";

import Chat from "./components/ChatInterfaceNOUS";
import GraphContextMenu from "./components/GraphContextMenu";
import GraphLegend from "./components/GraphLegend";
import RootStoreContext from "./context/RootStoreContext";
import { resolveUIDs } from "./RLCBaseClient";
import { retrieveEnvironment } from "./CCClient";

import { deepMerge } from "grommet/utils";
import { grommet } from "grommet/themes";

import { ccSocket } from "./socket";

// import "./App.css";
//
const colors = {
  brand: "#0A3D62",
  selected: "#008080",
  textColor: "#fff",
};

const theme = deepMerge(grommet, {
  global: {
    font: {
      family: "Jura",
      size: "18px",
      height: "20px",
    },
    colors,
  },
  button: {
    border: {
      radius: "4px",
      width: "1px",
    },
  },
  checkBox: {
    size: "16px",
    icon: {
      size: "10px",
    },
  },
});

const cats = {
  730044: "Physical Object",
  193671: "Occurrence",
  160170: "Role",
  790229: "Aspect",
  //970002: "Information",
  2850: "Relation",
};

const App: React.FC = () => {
  const rootStore = useContext(RootStoreContext);
  const { factDataStore, graphViewStore, semanticModelStore } = rootStore;
  const { addFacts, addConcepts, setCategories } = factDataStore;
  const [isConnected, setIsConnected] = useState(false);
  // const [cats, setCats] = useState([]);

  const [isReady, setIsReady] = useState(false);
  //const collections = await getCollections();
  // useEffect(() => {
  //   axiosInstance
  //     .get(COLLECTIONS_ENDPOINT)
  //     .then((response) => {
  //       setCollections(response.data);
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //     });
  // }, []);

  const establishCats = async () => {
    const concepts = await resolveUIDs(
      Object.keys(cats).map((x) => parseInt(x)),
    );
    console.log("vvvv - CONCEPTS vvvv:");
    console.log(concepts);
    const newCats = [];
    for (const [key, name] of Object.entries(cats)) {
      const concept = concepts.find((c) => c.uid === parseInt(key));
      const { uid, descendants } = concept;
      newCats.push({ uid, name, descendants });
    }
    console.log("vvvv - CATEGORIES vvvv:");
    console.log(newCats);
    setCategories(newCats);
  };

  useEffect(() => {
    const retrieveEnv = async () => {
      const env = await retrieveEnvironment();
      console.log("vvvv - ENVIRONMENT vvvv:");
      console.log(env);
      factDataStore.addFacts(env.facts);
      semanticModelStore.addModels(env.models);
      graphViewStore.selectedNode = env.selectedEntity;
    };

    const foobarbaz = async () => {
      await establishCats();
      await retrieveEnv();
      console.log("NOW WE'RE READY!!!!!!!!!!!!!!!!");
      setIsReady(true);
    };

    foobarbaz();
  }, []);

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
      console.log(typeof d.uid);
      graphViewStore.selectedNode = d.uid;
    };

    const onAddFacts = (d) => {
      console.log(d);
      factDataStore.addFacts(d.facts);
      semanticModelStore.addModels(d.models);
    };

    const onRemFacts = (d) => {
      factDataStore.removeFacts(d.fact_uids);
      semanticModelStore.models.forEach((model) => {
        if (!factDataStore.hasObject(model.uid))
          semanticModelStore.removeModel(model.uid);
      });
    };

    const onEntitiesCleared = () => {
      factDataStore.clearFacts();
      semanticModelStore.clearModels();
      graphViewStore.selectedNode = null;
    };

    const onNoneSelected = () => {
      graphViewStore.selectedNode = null;
    };

    ccSocket.on("connect", onConnect);
    ccSocket.on("disconnect", onDisconnect);

    ccSocket.on("system:selectEntity", onSelectEntity);
    ccSocket.on("system:selectedNone", onNoneSelected);
    ccSocket.on("system:addFacts", onAddFacts);
    ccSocket.on("system:remFacts", onRemFacts);
    ccSocket.on("system:updateCategoryDescendantsCache", establishCats);
    ccSocket.on("system:entitiesCleared", onEntitiesCleared);

    return () => {
      ccSocket.off("connect", onConnect);
      ccSocket.off("disconnect", onDisconnect);

      ccSocket.off("system:selectEntity", onSelectEntity);
      ccSocket.off("system:addFacts", onAddFacts);
      ccSocket.off("system:remFacts", onRemFacts);
      ccSocket.off("system:updateCategoryDescendantsCache", establishCats);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Grommet full theme={theme}>
        <Box fill>
          <Box align="end">
            <Text color={isConnected ? "green" : "red"} size="xsmall">
              {isConnected ? "[CC connected]" : "[CC disconnected]"}
            </Text>
          </Box>
          <GraphContextMenu />
          <Tabs flex>
            <Tab title="explore">
              <Grid
                fill
                rows={["xxsmall", "flex"]}
                columns={["medium", "flex", "medium"]}
                gap="small"
                areas={[
                  { name: "header", start: [0, 0], end: [2, 0] },
                  { name: "details", start: [2, 1], end: [2, 1] },
                  { name: "main", start: [1, 1], end: [1, 1] },
                  { name: "chat", start: [0, 1], end: [0, 1] },
                ]}
              >
                <Box gridArea="header" background="brand">
                  <Header />
                </Box>
                <Box gridArea="details" background="light-5" overflow="scroll">
                  <SelectionDetails />
                </Box>
                <Box gridArea="main" background="light-2" direction="column">
                  {isReady && (
                    <Box
                      basis="full"
                      overflow="hidden"
                      style={{ backgroundColor: "#1d1c1b" }}
                    >
                      <Stack fill anchor="bottom-right">
                        <GraphContainer />
                        <GraphLegend />
                      </Stack>
                    </Box>
                  )}
                </Box>
                <Box gridArea="chat" background="light-2">
                  <Chat />
                </Box>
              </Grid>
            </Tab>
            <Tab title="validate/insert">
              <Box pad="medium">{<InsertTab />}</Box>
            </Tab>
            <Tab title="Review">
              <Box pad="medium">{/*<ReviewTab />*/}</Box>
            </Tab>
          </Tabs>
        </Box>
      </Grommet>
    </ErrorBoundary>
  );
};

export default App;
