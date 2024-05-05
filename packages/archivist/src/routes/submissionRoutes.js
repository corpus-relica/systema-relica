import express from "express";
import {
  submitBinaryFact,
  submitBinaryFacts,
} from "../controllers/submissionController.js";

import {
  getLineage,
  updateFactDefinition,
} from "../controllers/gellishBaseController.js";

import cache from "../utils/cache.js";

const router = express.Router();

const updateLineage = async (descendantUID) => {
  const lineage = await getLineage(descendantUID);
  console.log("lineage", lineage);

  await Promise.all(
    lineage.map(async (ancestorUID) => {
      await cache.addDescendantTo(ancestorUID, descendantUID);
    }),
  );
};

router.post("/binaryFact", async (req, res) => {
  const result = await submitBinaryFact(req.body);

  // update the lineage cache
  await updateLineage(result.fact.lh_object_uid);

  // TODO: could probably be optimized by only
  // updating the lineage of the unique lh_object_uid
  cache.clearDescendants();

  res.send(result);
});

router.post("/binaryFacts", async (req, res) => {
  const result = await submitBinaryFacts(req.body);

  // update the lineage cache
  await Promise.all(
    result.facts.map(async (fact) => {
      await updateLineage(fact.lh_object_uid);
    }),
  );

  // TODO: could probably be optimized by only
  // updating the lineage of the unique lh_object_uids
  cache.clearDescendants();

  res.send(result);
});

router.put("/definition", async (req, res) => {
  const { fact_uid, partial_definition, full_definition } = req.body;
  const result = await updateFactDefinition(
    +fact_uid,
    partial_definition,
    full_definition,
  );
  res.send(result);
});

export default router;
