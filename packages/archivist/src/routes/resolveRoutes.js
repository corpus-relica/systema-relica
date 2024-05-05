import express from "express";
import cache from "../utils/cache.js";

const router = express.Router();

router.get("/descendants", async (req, res) => {
  const result = await cache.allDescendantsOf(parseInt(req.query.uid));
  res.send(result);
});

export default router;
