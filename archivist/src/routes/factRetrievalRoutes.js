import express from "express";
import {
  getSubtypes,
  getClassified,
  getFactsAboutIndividual,
  getFactsAboutKind,
  getFactsAboutRelation,
  getAllRelatedFactsRecursive,
  getRelatedOnUIDSubtypeCone,
  getFactsRelatingEntities,
} from "../controllers/factRetrievalController.js";
import {
  getClassificationFact,
  getClassificationFacts,
  getSpecializationFact,
  getSpecializationFacts,
  getSpecializationHierarchy,
  getDefinitiveFacts,
  getSH,
  getSynonyms,
  getInverses,
  getFact,
  getFacts,
} from "../controllers/gellishBaseController.js";

const router = express.Router();

router.get("/subtypes", async (req, res) => {
  const result = await getSubtypes(parseInt(req.query.uid));
  res.send(result);
});

router.get("/classified", async (req, res) => {
  const result = await getClassified(parseInt(req.query.uid));
  res.send(result);
});

router.get("/classificationFact", async (req, res) => {
  const result = await getClassificationFact(parseInt(req.query.uid));
  res.send(result);
});

router.get("/classificationFacts", async (req, res) => {
  const result = await getClassificationFacts(parseInt(req.query.uid));
  res.send(result);
});

router.get("/specializationHierarchy", async (req, res) => {
  const result = await getSpecializationHierarchy(parseInt(req.query.uid));
  res.send(result);
});

router.get("/SH", async (req, res) => {
  const result = await getSH(parseInt(req.query.uid));
  res.send(result);
});

router.get("/specializationFact", async (req, res) => {
  // console.log("SPECIALIZATION FACT_");
  const result = await getSpecializationFact(parseInt(req.query.uid));
  // console.log(result);
  res.send(result);
});

router.get("/specializationFacts", async (req, res) => {
  const result = await getSpecializationFacts(req.query.uids);
  // console.log("SPECIALIZATION FACTS");
  // console.log(result);
  res.send(result);
});

router.get("/synonymFacts", async (req, res) => {
  const result = await getSynonyms(parseInt(req.query.uid));
  res.send({ facts: result });
});

router.get("/inverseFacts", async (req, res) => {
  const result = await getInverses(parseInt(req.query.uid));
  res.send({ facts: result });
});

router.get("/factsAboutKind", async (req, res) => {
  const result = await getFactsAboutKind(parseInt(req.query.uid));
  res.send(result);
});

router.get("/factsAboutIndividual", async (req, res) => {
  const result = await getFactsAboutIndividual(parseInt(req.query.uid));
  res.send(result);
});

router.get("/factsAboutRelation", async (req, res) => {
  const result = await getFactsAboutRelation(parseInt(req.query.uid));
  res.send(result);
});

router.get("/allRelatedFacts", async (req, res) => {
  const result = await getAllRelatedFactsRecursive(
    parseInt(req.query.uid),
    parseInt(req.query.depth) || 1
  );
  res.send(result);
});

router.get("/fact", async (req, res) => {
  const result = await getFact(parseInt(req.query.uid));
  res.send(result);
});

router.get("/facts", async (req, res) => {
  const factUIDs = JSON.parse(req.query.uids);
  const result = await getFacts(factUIDs);
  res.send(result);
});

router.get("/relatedOnUIDSubtypeCone", async (req, res) => {
  const { lh_object_uid, rel_type_uid } = req.query;
  const result = await getRelatedOnUIDSubtypeCone(
    parseInt(lh_object_uid),
    parseInt(rel_type_uid)
  );
  res.send(result);
});

router.get("/definitiveFacts", async (req, res) => {
  const {uid} = req.query;
  const result = await getDefinitiveFacts(parseInt(uid));
  res.send(result);
});

router.get("/factsRelatingEntities", async (req, res) => {
  const {uid1, uid2} = req.query;
  const result = await getFactsRelatingEntities(parseInt(uid1), parseInt(uid2));
  res.send(result);
});

export default router;
