import { createClient } from "redis";

console.log(" == CONNECT REDIS ===");
console.log(" -- uri -- ", process.env.RELICA_REDIS_URL);
// console.log(" -- user -- ", process.env.RELICA_REDIS_USER);
console.log(" -- pw -- ", process.env.RELICA_REDIS_PASSWORD);

export const client = createClient({
  url: process.env.RELICA_REDIS_URL,
  // username: process.env.RELICA_REDIS_USER,
  password: process.env.RELICA_REDIS_PASSWORD,
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.on("connect", async () => {
  console.log("Redis client connected");

  try {
    // Example: Retrieve the number of keys in the database
    const numKeys = await client.dbSize();
    console.log(`Number of keys in Redis: ${numKeys}`);

    // // Example: Retrieve a specific key-value pair
    // const value = await client.get("myKey");
    // console.log(`Value of 'myKey': ${value}`);

    // // Example: Retrieve all keys in the database
    // const keys = await client.keys("*");
    // console.log(`Keys in Redis: ${keys}`);

    // Add more Redis commands as needed to retrieve and log data
  } catch (error) {
    console.error("Error retrieving data from Redis:", error);
  }
});

await client.connect();
