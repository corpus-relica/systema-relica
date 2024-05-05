import express from "express";
import {
  getTextSearch,
  getUIDSearch,
} from "../controllers/generalSearchController.js";

const router = express.Router();

router.get("/text", async (req, res) => {
  const {
    searchTerm,
    collectionUID = '',
    page = 1,
    pageSize = 50,
    filter = null,
    exactMatch = false,
  } = req.query;
  const result = await getTextSearch(
    searchTerm,
    collectionUID,
    parseInt(page),
    parseInt(pageSize),
    filter,
    exactMatch === "true" ? true : false
  );
  res.send(result);
});

router.get("/uid", async (req, res) => {
  const {
    searchTerm,
    collectionUID,
    page = 1,
    pageSize = 50,
    filter = null,
  } = req.query;
  const result = await getUIDSearch(
    parseInt(searchTerm),
    collectionUID,
    parseInt(page),
    parseInt(pageSize),
    filter
  );
  res.send(result);
});

export default router;
