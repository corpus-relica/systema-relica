import express from "express";
import { getDefinition } from "../controllers/definitionController.js";

const router = express.Router();

router.get("/get", async (req, res) => {
  const result = await getDefinition(parseInt(req.query.uid));
  res.send(result);
});

export default router;
