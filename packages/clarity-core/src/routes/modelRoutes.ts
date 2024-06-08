import express from "express";
import {
  retrieveKindModel,
  retrieveIndividualModel,
  retrieveModel,
  retrieveModels,
  updateDefinition,
} from "../controllers/modelController.js";

const router = express.Router();

router.get("/kind", async (req, res) => {
  const { uid } = req.query;
  if (uid === undefined) {
    res.send("No UID provided");
  } else {
    const result = await retrieveKindModel(+uid);
    res.send(result);
  }
});

router.get("/individual", async (req, res) => {
  const { uid } = req.query;
  if (uid === undefined) {
    res.send("No UID provided");
  } else {
    const result = await retrieveIndividualModel(+uid);
    res.send(result);
  }
});

router.get("/", async (req, res) => {
  const { uid, uids } = req.query;
  if (uid !== undefined) {
    const result = await retrieveModel(+uid);
    res.send(result);
  } else if (uids !== undefined) {
    let parsedUIDs;
    if (typeof uids === "string") {
      parsedUIDs = JSON.parse(uids);
    } else if (Array.isArray(uids)) {
      parsedUIDs = uids;
    }
    const result = await retrieveModels(parsedUIDs);
    res.send(result);
  } else {
    res.send("UIDs must be an array");
  }
});

router.put("/definition", async (req, res) => {
  const { fact_uid, partial_definition, full_definition } = req.body;
  if (
    fact_uid === undefined ||
    partial_definition === undefined ||
    full_definition === undefined
  ) {
    res.send("fact_uid or partial_definition or full_definition not provided");
  } else {
    const result = await updateDefinition(
      +fact_uid,
      partial_definition,
      full_definition,
    );
    res.send(result);
  }
});

export default router;
