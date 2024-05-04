import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import { Server } from "socket.io";

import initApp from "./initialization/initApp.js";
import { setSocket } from "./utils/socket.js";

import kindSearchRoutes from "./routes/kindSearchRoutes.js";
import individualSearchRoutes from "./routes/individualSearchRoutes.js";
import generalSearchRoutes from "./routes/generalSearchRoutes.js";
import factRetrievalRoutes from "./routes/factRetrievalRoutes.js";
import entityRetrievalRoutes from "./routes/entityRetrievalRoutes.js";
import completionRoutes from "./routes/completionRoutes.js";
import validationRoutes from "./routes/validationRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import definitionRoutes from "./routes/definitionRoutes.js";
import conceptRoutes from "./routes/conceptRoutes.js";
import creationRoutes from "./routes/creationRoutes.js";
import deletionRoutes from "./routes/deletionRoutes.js";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow your client application's origin
    methods: ["GET", "POST"], // Allowed request methods
  },
});

const apiPort = process.env.RELICA_NEO4J_API_PORT;

app.use(express.json());
// Enable CORS for all routes

app.use(
  cors({
    origin: "*", //process.env.RELICA_NEO4J_ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
  // cors(),
);

app.use("/concept", conceptRoutes);
app.use("/definition", definitionRoutes);

app.use("/kindSearch", kindSearchRoutes);
app.use("/individualSearch", individualSearchRoutes);
app.use("/generalSearch", generalSearchRoutes);
app.use("/factRetrieval", factRetrievalRoutes);
//
app.use("/retrieveEntity", entityRetrievalRoutes);
app.use("/completion", completionRoutes);
app.use("/validate", validationRoutes);
app.use("/submit", submissionRoutes);
app.use("/delete", deletionRoutes);
//

const options = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Relica-Neo4j",
      version: "1.0.0",
    },
  },
  apis: ["./src/routes/*.js"],
};

const openapiSpecification = swaggerJsdoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification));

//

io.on("connection", (socket) => {
  setSocket(socket);
  socket.on("message", (d) => {
    switch (d.role) {
      case "user":
        switch (d.type) {
          case "getSubtypes":
            getSubtypes(d.payload.uid);
            break;
          case "getSpecializationHierarchy":
            getSpecializationHierarchy(d.payload.uid);
            break;
          case "removeEntity":
            removeEntity(d.payload.uid);
            break;
          case "removeEntitySubtypesRecursive":
            break;
          default:
            console.log("WHAT DO YOU WANT?");
            console.log(d);
            break;
        }
      case "system":
        break;
      case "assistant":
        break;
      default:
        console.log("WHO 'DIS?");
        break;
    }
  });
  socket.on("addFactsToEnvironment", (d) => {
    console.log("addFactsToEnvironment");
    console.log(d);

    insert(d.map((fact) => "" + fact.fact_uid));
    // im tired as shit right now and I'm going to forget that I lazily let this shit slide
    // when I'm wondering why i have inconsistent fact representations on my frontend, but wth mfabt, amiright?
    console.log(socket);
    socket.broadcast.emit("message", {
      role: "system",
      type: "addFacts",
      payload: { facts: d },
    });
  });
});

async function startServer() {
  console.log("Starting Relica-Neo4j...");
  await initApp();
  // app.listen(apiPort, () => {
  //   console.log(`Relica-Neo4j listening on port ${apiPort}`);
  // });
  server.listen(
    {
      host: "0.0.0.0",
      port: apiPort,
    },
    () => {
      console.log("server running at http://0.0.0.0:" + apiPort);
    },
  );
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
