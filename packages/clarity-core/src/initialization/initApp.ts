// import redisService from "../services/redisService";
import pgClient from "../client/pgClient.js";
import { retrieveEnvironment } from "../services/environmentService.js";

export default async function initializeApp() {
  // await redisService.init();
  await pgClient.connect();
  await retrieveEnvironment();

  // Any other setup tasks...
  console.log("App initialized");
}
