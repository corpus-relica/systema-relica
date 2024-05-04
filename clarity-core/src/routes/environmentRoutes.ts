import { Request, Response, Router } from "express";
import {
  retrieveEnvironment,
  textSearch,
  loadEntity,
  specializeKind,
  classifyIndividual,
  getSpecializationHierarchy,
  getSpecializationFactByUID,
  getClassified,
  getClassificationFactByUID,
  getAllRelatedFacts,
  listSubtypes,
} from "../controllers/environmentController";
import socketServer from "../utils/SocketServer";

const router = Router();

router.get("/retrieve", async (req: Request, res: Response) => {
  const { envID } = req.query;
  console.log("~~~~~~~~~~~~RETRIEVE~~~~~~~~~~~~");
  try {
    const result = await retrieveEnvironment();
    console.log(result);
    res.send(result);
  } catch (e) {
    res.sendStatus(500).send("Error retrieving environment");
  }
});

router.get("/loadEntity/:uid", async (req: Request, res: Response) => {
  // Extract 'uid' from the request parameters and ensure it's a string
  const uid = req.params.uid;
  if (typeof uid === "string") {
    // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
    const result = await loadEntity(parseInt(uid));
    res.json(result);
  } else {
    // Handle the case where 'uid' is not a string
    res.status(400).send("Invalid UID");
  }
});

router.get("/textSearch/:searchTerm", async (req: Request, res: Response) => {
  // Extract 'searchTerm' from the request parameters and ensure it's a string
  const searchTerm = req.params.searchTerm;

  if (typeof searchTerm === "string") {
    // Now 'searchTerm' is guaranteed to be a string, so we can safely use parseInt
    const result = await textSearch(searchTerm);
    res.json(result);
  } else {
    // Handle the case where 'searchTerm' is not a string
    res.status(400).send("Invalid search term");
  }
});

router.get(
  "/specializeKind/:uid/:supertypeName/:name",
  async (req: Request, res: Response) => {
    // Extract 'uid' from the request parameters and ensure it's a string
    const uid = req.params.uid;
    const supertypeName = req.params.supertypeName;
    const name = req.params.name;

    if (typeof uid === "string") {
      // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
      const result = await specializeKind(parseInt(uid), supertypeName, name);
      res.json(result);
    } else {
      // Handle the case where 'uid' is not a string
      res.status(400).send("Invalid UID");
    }
  },
);

router.get(
  "/classifyIndividual/:uid/:typeName/:name",
  async (req: Request, res: Response) => {
    // Extract 'uid' from the request parameters and ensure it's a string
    const uid = req.params.uid;
    const typeName = req.params.typeName;
    const name = req.params.name;

    if (typeof uid === "string") {
      // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
      const result = await classifyIndividual(parseInt(uid), typeName, name);
      res.json(result);
    } else {
      // Handle the case where 'uid' is not a string
      res.status(400).send("Invalid UID");
    }
  },
);

router.get(
  "/loadSpecializationHierarchy/:uid",
  async (req: Request, res: Response) => {
    // Extract 'uid' from the request parameters and ensure it's a string
    const uid = req.params.uid;
    if (typeof uid === "string") {
      // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
      const result = await getSpecializationHierarchy(parseInt(uid));
      res.json(result);
    } else {
      // Handle the case where 'uid' is not a string
      res.status(400).send("Invalid UID");
    }
  },
);

router.get("/loadSpecialization/:uid", async (req: Request, res: Response) => {
  const uid = req.params.uid;
  if (typeof uid === "string") {
    const result = await getSpecializationFactByUID(parseInt(uid));
    res.json(result);
  } else {
    res.status(400).send("Invalid UID");
  }
});

router.get("/loadClassified/:uid", async (req: Request, res: Response) => {
  const uid = req.params.uid;
  if (typeof uid === "string") {
    const result = await getClassified(parseInt(uid));
    res.json(result);
  } else {
    res.status(400).send("Invalid UID");
  }
});

router.get("/loadClassification/:uid", async (req: Request, res: Response) => {
  const uid = req.params.uid;
  if (typeof uid === "string") {
    const result = await getClassificationFactByUID(parseInt(uid));
    res.json(result);
  } else {
    res.status(400).send("Invalid UID");
  }
});

router.get("/loadAllRelatedFacts/:uid", async (req: Request, res: Response) => {
  const uid = req.params.uid;
  if (typeof uid === "string") {
    const result = await getAllRelatedFacts(parseInt(uid));
    res.json(result);
  } else {
    res.status(400).send("Invalid UID");
  }
});

router.get("/listSubtypes/:uid", async (req: Request, res: Response) => {
  const uid = req.params.uid;
  if (typeof uid === "string") {
    const result = await listSubtypes(parseInt(uid));
    res.json(result);
  } else {
    res.status(400).send("Invalid UID");
  }
});

export default router;
