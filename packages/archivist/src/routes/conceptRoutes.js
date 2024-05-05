import express from "express";
import { getEntities } from "../controllers/gellishBaseController.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * @openapi
 * /concept/descendants:
 *   get:
 *     description: given uid return list of descendants!
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
router.get("/descendants", async (req, res) => {
  const result = await cache.allDescendantsOf(parseInt(req.query.uid));
  res.send(result);
});

/**
 * @openapi
 * /concept/entities:
 *   get:
 *     summary: Retrieve Entities by UIDs
 *     description: Given a list of unique identifiers (UIDs), return the corresponding entity details.
 *     parameters:
 *       - in: query
 *         name: uids
 *         required: true
 *         description: Comma-separated list of unique identifiers for the entities.
 *         schema:
 *           type: string
 *           example: '2850,160170,193671,730044,790229'
 *     responses:
 *       200:
 *         description: A JSON array of entities corresponding to the provided UIDs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   uid:
 *                     type: string
 *                     description: The unique identifier of the entity.
 *                     example: '123'
 *                   name:
 *                     type: string
 *                     description: The name of the entity.
 *                     example: 'Entity Name'
 *                   description:
 *                     type: string
 *                     description: A brief description of the entity.
 *                     example: 'This is an example entity.'
 *       400:
 *         description: Bad request. The list of UIDs was not provided or was invalid.
 *       404:
 *         description: No entities were found matching the provided UIDs.
 */
router.get("/entities", async (req, res) => {
  console.log(req.query);

  const result = await getEntities(JSON.parse(req.query.uids));
  res.send(result);
});

export default router;
