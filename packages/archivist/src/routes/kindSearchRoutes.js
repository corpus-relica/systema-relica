import express from "express";
import {
  getTextSearchKind,
  getUIDSearchKind,
} from "../controllers/kindSearchController.js";

const router = express.Router();

router.get("/text", async (req, res) => {
  const { searchTerm, collectionUID, page = 1, pageSize = 50 } = req.query;
  const result = await getTextSearchKind(
    searchTerm,
    collectionUID,
    parseInt(page),
    parseInt(pageSize)
  );
  res.send(result);
});

router.get("/uid", async (req, res) => {
  const { searchTerm, collectionUID = "", page = 1, pageSize = 50 } = req.query;
  const result = await getUIDSearchKind(
    searchTerm,
    collectionUID,
    parseInt(page),
    parseInt(pageSize)
  );
  res.send(result);
});

export default router;
