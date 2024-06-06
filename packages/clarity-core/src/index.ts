import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import initApp from "./initialization/initApp";

import modelRoutes from "./routes/modelRoutes";

import environmentRoutes from "./routes/environmentRoutes";
import { setSelectedEntity } from "./services/environmentService";
import { deleteEntity } from "./services/relicaNeo4jService";
import {
  getSpecializationHierarchy,
  getSubtypes,
  getSubtypesCone,
  getAllRelatedFacts,
  loadEntity,
  loadEntities,
  removeEntity,
  removeEntities,
  removeEntityDescendants,
  clearEntities,
} from "./controllers/environmentController";

import socketServer from "./utils/SocketServer";

/////////////////////////////////////////////////////////////////////////

const app = express();
const server = createServer(app);
socketServer.init(server);

const apiPort = process.env.RELICA_CLARITY_CORE_API_PORT;

app.use(express.json());
// Enable CORS for all routes
app.use(
  cors({
    origin: process.env.RELICA_CLARITY_CORE_ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

//

async function startServer() {
  console.log("Starting Clarity Core...");
  await initApp();
  // app.listen(apiPort, () => {
  //   console.log(`Relica-Neo4j listening on port ${apiPort}`);
  // });
  server.listen({ port: apiPort, host: "0.0.0.0" }, () => {
    console.log(
      "//// Relica Clarity-Core Server running at http://0.0.0.0:" + apiPort,
    );
  });
}

//
app.use("/environment", environmentRoutes);
app.use("/model", modelRoutes);
//

type SocketMessage = {
  role: string;
  type: string;
  payload: any;
};

const io = socketServer.io;
// setSocket(io);

io &&
  io.on("connection", (socket: any) => {
    const clientName = socket.handshake.query.clientName;
    if (socket.handshake.query.clientName === "NOUS") {
      console.log(":// NOUS CONNECTED !!!");

      socket.on("nous:selectEntity", (d: { uid: number }) => {
        console.log("NOUS:SELECT ENTITY");
        console.log(d);
        setSelectedEntity(d.uid);
        socketServer.emit("system", "selectEntity", { uid: d.uid });
      });

      socket.on("nous:loadEntity", async (d: { uid: number }, cbk: any) => {
        console.log("NOUS:LOAD ENTITY");
        console.log(d);
        const res = await loadEntity(d.uid);
        console.log(res);
        if (cbk) {
          cbk(res);
        }
      });
    } else if (socket.handshake.query.clientName === "INTEGRATOR") {
      console.log(":// KNOWLEDGE INTEGRATOR CONNECTED !!!");

      // setSocket(io);

      socket.on("user:selectEntity", (d: { uid: number }) => {
        console.log("SELECT ENTITY");
        console.log(d);
        setSelectedEntity(d.uid);
        socketServer.emit("system", "selectEntity", { uid: d.uid });
      });

      socket.on("user:selectNone", () => {
        console.log("SELECT NONE");
        setSelectedEntity(null);
        socketServer.emit("system", "selectedNone", {});
      });

      socket.on("user:getSubtypes", (d: { uid: number }) => {
        console.log("GET SUBTYPES");
        console.log(d);
        getSubtypes(d.uid);
      });

      socket.on("user:getSubtypesCone", (d: { uid: number }) => {
        console.log("GET SUBTYPES CONE");
        console.log(d);
        getSubtypesCone(d.uid);
      });

      socket.on("user:getSpecializationHierarchy", (d: { uid: number }) => {
        console.log("GET SH");
        console.log(d);
        getSpecializationHierarchy(d.uid);
      });

      socket.on("user:loadEntity", (d: { uid: number }) => {
        console.log("LOAD ENTITY");
        console.log(d);
        loadEntity(d.uid);
      });

      socket.on("user:loadEntities", (d: { uids: number[] }) => {
        console.log("LOAD ENTITIES");
        console.log(d);
        loadEntities(d.uids);
      });

      socket.on("user:removeEntity", (d: { uid: number }) => {
        console.log("REMOVE ENTITY");
        console.log(d);
        removeEntity(d.uid);
      });

      socket.on("user:removeEntities", (d: { uids: number[] }) => {
        console.log("REMOVE ENTITIES");
        console.log(d);
        removeEntities(d.uids);
      });

      socket.on("user:clearEntities", () => {
        console.log("CLEAR ENTITIES");
        clearEntities();
        // socketServer.emit("system", "clearEntities", {});
      });

      socket.on("user:deleteEntity", async (d: { uid: number }) => {
        console.log("DELETE ENTITY");
        console.log(d);

        const result = await deleteEntity(d.uid);
        //if result is success
        console.log("RESULT", result);
        removeEntity(d.uid);
        console.log("Entity deleted");
      });

      socket.on("user:removeEntitySubtypesRecursive", (d: { uid: number }) => {
        console.log("REMOVE ENTITY SUBTYPES RECURSIVE");
        console.log(d);
        removeEntityDescendants(d.uid);
      });

      socket.on("user:getAllRelatedFacts", (d: { uid: number }) => {
        console.log("GET ALL RELATED FACTS");
        console.log(d);
        getAllRelatedFacts(d.uid);
      });

      // socket.on("addFactsToEnvironment", (d) => {
      //   console.log("addFactsToEnvironment");
      //   console.log(d);

      //   insert(d.map((fact) => "" + fact.fact_uid));
      //   // im tired as shit right now and I'm going to forget that I lazily let this shit slide
      //   // when I'm wondering why i have inconsistent fact representations on my frontend, but wth mfabt, amiright?
      //   console.log(socket);
      //   socket.broadcast.emit("message", {
      //     role: "system",
      //     type: "addFacts",
      //     payload: { facts: d },
      //   });
      // });
    }
  });

io &&
  io.on("disconnect", () => {
    console.log("DISCONNECT!!!");
  });

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
