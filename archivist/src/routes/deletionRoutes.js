import express from 'express';
import {deleteEntity} from '../controllers/deletionController.js';


const router = express.Router();

router.delete('/entity', async (req, res) => {
  const {uid} = req.query;
  if (!uid) {
    res.status(400).send('UID is required');
  }
  console.log("DELETE ENTITY", uid)
  const result = await deleteEntity(parseInt(uid));
  res.send(result);
});

export default router;
