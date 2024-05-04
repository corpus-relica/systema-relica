import express from "express";
import { createKind } from "../controllers/creationController.js";

const router = express.Router();

router.post("/kind", async (req, res) => {
  const { parentUID, name, description } = req.body;
  const result = await createKind(parentUID, name, description);
  res.send(result);
});

export default router;
