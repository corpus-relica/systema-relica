import express from "express";
import { simpleValidateBinaryFact } from "../controllers/validationController.js";

const router = express.Router();

router.get("/binaryFact", async (req, res) => {
  const result = await simpleValidateBinaryFact(req.query);
  res.send(result);
});

// app.get("/isClassifiedAsP", async (req, res) => {
//   const result = await isClassifiedAsP(
//     req.query.individual_uid + "",
//     req.query.kind_uid + ""
//   );
//   res.send(result);
// });

export default router;
