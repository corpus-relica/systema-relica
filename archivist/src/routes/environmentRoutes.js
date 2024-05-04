import express from "express";
import { retrieveEnvironment } from "../controllers/environmentController.js";

const router = express.Router();

router.get("/retrieve", async (req, res) => {
  const { envID } = req.query;
  const result = await retrieveEnvironment();
  res.send(result);
});

export default router;
