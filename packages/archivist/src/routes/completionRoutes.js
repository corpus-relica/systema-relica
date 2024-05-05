import express from "express";
import {
  getLHObjectCompletion,
  getRHObjectCompletion,
} from "../controllers/completionController.js";

const router = express.Router();

router.get("/lhObject", async (req, res) => {
  const result = await getLHObjectCompletion(
    req.query.rel_type_uid + "",
    req.query.rh_object_uid + ""
  );
  res.send(result);
});

router.get("/rhObject", async (req, res) => {
  const result = await getRHObjectCompletion(
    req.query.lh_object_uid + "",
    req.query.rel_type_uid + ""
  );
  res.send(result);
});

export default router;
