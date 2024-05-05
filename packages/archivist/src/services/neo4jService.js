import neo4j from "neo4j-driver";

console.log(" == CONNECT NEO4J ===");
console.log(" -- uri -- ", process.env.RELICA_NEO4J_URI);
console.log(" -- user -- ", process.env.RELICA_NEO4J_USER);
console.log(" -- pw -- ", process.env.RELICA_NEO4J_PASSWORD);

const uri = process.env.RELICA_NEO4J_URI;
const user = process.env.RELICA_NEO4J_USER;
const password = process.env.RELICA_NEO4J_PASSWORD;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

driver
  .verifyConnectivity()
  .then(() => {
    console.log("Connected to Neo4j");
  })
  .catch((error) => {
    console.error("Failed to connect to Neo4j:", error);
    process.exit(1);
  });

export default driver;

export const resolveInt = (val) => {
  if (neo4j.isInt(val)) {
    if (neo4j.integer.inSafeRange(val)) {
      return val.toNumber();
    } else {
      return val.toString();
    }
  } else {
    return val;
  }
};

export const convertNeo4jInts = (node) => {
  try {
    node.identity = resolveInt(node.identity);
    node.properties = Object.entries(node.properties).reduce(
      (acc, [key, value]) => {
        acc[key] = resolveInt(value);
        return acc;
      },
      {},
    );
    return node;
  } catch (error) {
    throw error;
  }
};
// Initialize a promise outside of the connectToNeo4j function

// let driverPromise;

// function connectToNeo4j(retries = 5) {
//   return new Promise((resolve, reject) => {
//     const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

//     driver
//       .verifyConnectivity()
//       .then(() => {
//         console.log("Connected to Neo4j");
//         resolve(driver); // Resolve the promise with the driver
//       })
//       .catch((error) => {
//         console.error("Failed to connect to Neo4j:", error);
//         if (retries > 0) {
//           console.log(`Retry in 5 seconds. Retries left: ${retries - 1}`);
//           setTimeout(
//             () =>
//               connectToNeo4j(retries - 1)
//                 .then(resolve)
//                 .catch(reject),
//             5000,
//           );
//         } else {
//           reject(error); // Reject the promise after all retries are exhausted
//         }
//       });
//   });
// }

// // Call the function and store the promise
// driverPromise = connectToNeo4j();

// export function getDriver() {
//   return driverPromise;
// }
