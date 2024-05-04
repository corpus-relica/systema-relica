import pgClient from "../client/pgClient";
import { Fact } from "../types";

export async function retrieveEnvironment() {
  console.log("FUCKING RETREIVE ENVIRONMENT!!!!");

  const models = await pgClient.query("SELECT * FROM env_model");
  const facts = await pgClient.query("SELECT * FROM env_fact");

  console.log("MODELS");
  console.log(models);
  console.log("FACTS");
  console.log(facts);
  console.log("???????????????????????????????????????");

  return {
    models: models.rows.map((row: any) => row.model),
    facts: facts.rows.map((row: any) => row.fact),
  };
}

export async function insertFacts(facts: Fact[]) {
  for (const fact of facts) {
    const res = await pgClient.query(
      "INSERT INTO env_fact (uid, fact) VALUES ($1, $2)",
      [fact.fact_uid, fact],
    );
  }
}

export async function insertModels(models: any[]) {
  for (const model of models) {
    const res = await pgClient.query(
      "INSERT INTO env_model (uid, model) VALUES ($1, $2)",
      [model.uid, model],
    );
  }
}

export async function removeModels(uids: number[]) {
  const res = await pgClient.query(
    "DELETE FROM env_model WHERE uid = ANY($1::int[])",
    [uids],
  );
}

export async function removeFacts(uids: number[]) {
  const res = await pgClient.query(
    "DELETE FROM env_fact WHERE uid = ANY($1::int[])",
    [uids],
  );
}

export async function clearEnvironment() {
  const res = await pgClient.query("DELETE FROM env_model");
  const res2 = await pgClient.query("DELETE FROM env_fact");
  const res3 = await pgClient.query(
    "UPDATE env_selected_entity SET uid = NULL WHERE id = 1",
  );
  return;
}

export async function setSelectedEntity(uid: number | null) {
  if (uid === null) {
    return await pgClient.query(
      "UPDATE env_selected_entity SET uid = NULL WHERE id = 1",
    );
  }

  // only if uid exists as lh_object_uid or rh_object_uid in env_fact
  // env_fact schema is (uid, fact) where fact is a json object
  const res = await pgClient.query(
    "SELECT * FROM env_fact WHERE fact->>'lh_object_uid' = $1 OR fact->>'rh_object_uid' = $1",
    [uid],
  );

  if (res.rows.length === 0) {
    return;
  }

  // needs to insert into first row
  return await pgClient.query(
    "UPDATE env_selected_entity SET uid = $1 WHERE id = 1",
    [uid],
  );
}

export async function getSelectedEntity() {
  const res = await pgClient.query("SELECT * FROM env_selected_entity");
  return res.rows[0].uid;
}
