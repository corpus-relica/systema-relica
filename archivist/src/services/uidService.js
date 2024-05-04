import { execQuery } from "./queryService.js";
import { highestUID } from "./queries.js";
import neo4j from "neo4j-driver";

let highestValue = 1000000000; //neo4j.int("1000000000"); // Set to minThreshold initially

export const init = async () => {
  const minThreshold = 1000000000; //neo4j.int("1000000000");
  const maxThreshold = 2000000000; //neo4j.int("2000000000");

  const result = await execQuery(highestUID, {
    minThreshold,
    maxThreshold,
  });

  // If a higher value exists in the database, use it
  if (result[0] && result[0].get("highestValue")) {
    highestValue = neo4j.int(result[0].get("highestValue"));
    highestValue = highestValue.add(1);
  }

  console.log("//// init UID Service; current highest value: ", highestValue);
  return highestValue;
};

export const reserveUID = (n = 1) => {
  let reservedUIDs = [];

  try {
    for (let i = 0; i < n; i++) {
      highestValue = highestValue.add(1);
      console.log("//// reserve UID: ", highestValue.toString());
      reservedUIDs.push(highestValue);
    }
  } catch (error) {
    console.error("An error occurred while reserving UIDs: ", error);
  }

  return reservedUIDs;
};
