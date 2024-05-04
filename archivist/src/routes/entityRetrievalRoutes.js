import express from "express";
import {
  getEntityType,
  getCollections,
  getPrompt,
  setPrompt,
  getMinFreeEntityUID,
  setMinFreeEntityUID,
  getMinFreeFactUID,
  setMinFreeFactUID,
} from "../controllers/entityRetrievalController.js";
import { getCategory } from "../controllers/gellishBaseController.js";

const router = express.Router();

router.get("/type", async (req, res) => {
  const result = await getEntityType(req.query.uid + "");
  res.send(result);
});

router.get("/category", async (req, res) => {
  const result = await getCategory(parseInt(req.query.uid));
  res.send(result);
});

router.get("/collections", async (req, res) => {
  const result = await getCollections();
  res.send(result);
});

router.get("/prompt", async (req, res) => {
  const result = await getPrompt(req.query.uid + "");
  res.send(result);
});

router.post("/prompt", async (req, res) => {
  const { uid, prompt } = req.body;
  console.log(uid, prompt);
  const result = await setPrompt(uid, prompt);
  res.send(result);
});

router.get("/minFreeEntityUID", async (req, res) => {
  const result = await getMinFreeEntityUID();
  res.send(result);
});

router.post("/minFreeEntityUID", async (req, res) => {
  const { uid } = req.body;
  const result = await setMinFreeEntityUID(uid);
  res.send(result);
});

router.get("/minFreeFactUID", async (req, res) => {
  const result = await getMinFreeFactUID();
  res.send(result);
});

router.post("/minFreeFactUID", async (req, res) => {
  const { uid } = req.body;
  const result = await setMinFreeFactUID(uid);
  res.send(result);
});

export default router;
