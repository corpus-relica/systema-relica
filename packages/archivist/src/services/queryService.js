import neo4jDriver from "./neo4jService.js";

export async function execQuery(query, params) {
  const session = neo4jDriver.session();

  try {
    // Begin a new transaction
    const tx = session.beginTransaction();
    const result = await tx.run(query, params);

    // Commit the transaction
    await tx.commit();
    // console.log("####################### them mutherfucking result", result);
    return result.records;
  } catch (error) {
    // Handle any errors
    console.error(error);
    throw error;
  } finally {
    // Ensure session is closed
    await session.close();
  }
}
