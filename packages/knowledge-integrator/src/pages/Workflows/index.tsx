import React, {
  useEffect,
  useState,
  memo,
  useCallback,
  useRef,
  useReducer,
} from "react";
import {
  getWorkflows,
  getWorkflowState,
  initWorkflow,
  branchWorkflow,
  incrementWorkflowStep,
  decrementWorkflowStep,
  validateWorkflow,
  finalizeWorkflow,
  popWorkflow,
  setWorkflowValue,
  setWorkflowKGValue,
} from "../../CCClient";

import Step from "./Step";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Unstable_Grid2";
import Modal from "@mui/material/Modal";

import WorkflowTreeVisualizer from "./WorkflowTreeVisualizer";
import WorkflowStackVisualizer from "./WorkflowStackVisualizer";
import WorkflowFactsVisualizer from "./WorkflowFactsVisualizer";
import ContextVisualizer from "./ContextVisualizer";
import Typography from "@mui/material/Typography";

import XXX from "@relica/fact-search-ui";

const KGInput = (props: any) => {
  const { field, value, onChange, handleOpen } = props;
  return (
    <Box>
      {field}(KG):
      <input
        type="text"
        // onChange={onChange}
        onClick={() => {
          // console.log("clicked");
          handleOpen(field, onChange, 730000);
        }}
        defaultValue={value}
        placeholder={field}
      />
    </Box>
  );
};

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [stack, setStack] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [context, setContext] = useState(null);
  const [tree, setTree] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [facts, setFacts] = useState([]);
  const [state, setState] = useState({});

  const [nextEvents, setNextEvents] = useState([]);
  const [description, setDescription] = useState("");
  const [match, setMatch] = useState([]);
  const [create, setCreate] = useState([]);
  const [fieldSources, setFieldSources] = useState([]);

  const [pattern, setPattern] = useState([]);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<number>(0);
  const [openKey, setOpenKey] = useState("");

  useEffect(() => {
    const init = async () => {
      const workflows = await getWorkflows();
      setWorkflows(workflows);
      const state = await getWorkflowState();
      console.log("state");
      console.log(state);
      processState(state);
    };
    init();
  }, []);

  const processStack = (res: any) => {
    // let stacksAreEqual = true;
    // if (stack.length !== res.length) {
    //   stacksAreEqual = false;
    // } else {
    //   for (let i = 0; i < stack.length; i++) {
    //     if (stack[i] !== res[i]) {
    //       stacksAreEqual = false;
    //       break;
    //     }
    //   }
    // }
    // if (!stacksAreEqual) {
    //   setStack(res);
    // }
  };

  const processState = (res: any) => {
    setNextEvents(res.nextEvents);
    res.spec && setDescription(res.spec.description);
    res.spec && setMatch(res.spec.match);
    res.spec && setCreate(res.spec.create);
    res.spec && setFieldSources(res.spec.fieldSources);
    res.context && setContext(res.context);
    console.log("res", res);
    res.facts && setFacts(res.facts);
  };

  const handleWorkflowClick = async (workflowId: any) => {
    const firstStep = await initWorkflow(workflowId);
    const state = await getWorkflowState();
    processState(state);
  };

  const workflowsList = Object.keys(workflows).map((k) => (
    <Box
      key={k}
      onClick={() => {
        handleWorkflowClick(k);
      }}
    >
      {k}
    </Box>
  ));

  const relevantFieldSources = fieldSources.filter((fs: any) => {
    return (
      fs.source === "context" ||
      fs.source === "knowledge-graph" ||
      fs.source === "context | knowledge-graph"
    );
  });

  const inputs = relevantFieldSources.map((fs: any) => {
    if (fs.source === "context") {
      return (
        <Box key={fs.field}>
          {fs.field}(FREE):
          <input
            type="text"
            value={(context && context[fs.field]?.value) || ""}
            placeholder={fs.field}
            onChange={async (e: any) => {
              await setWorkflowValue(fs.field, e.target.value);
              const state = await getWorkflowState();
              processState(state);
            }}
          />
        </Box>
      );
    } else if (fs.source === "knowledge-graph") {
      return (
        <Box key={fs.field}>
          <KGInput
            field={fs.field}
            value={(context && context[fs.field]?.value) || ""}
            handleOpen={() => {
              handleOpen(fs.field);
            }}
          />
        </Box>
      );
    } else if (fs.source === "knowledge-graph | workflow") {
      return (
        <Box key={fs.field}>
          <KGInput
            field={fs.field}
            value={(context && context[fs.field]?.value) || ""}
            handleOpen={() => {
              handleOpen(fs.field);
            }}
          />
          <Button
            onClick={() => {
              // handleWorkflowButtonClick(fs.field, fs.workflowId);
            }}
          >
            Create New {fs.workflowId}
          </Button>
        </Box>
      );
    }
  });

  const handleOpen = (key: string, filter: number = 0) => {
    // filter !== 730000 ? setFilter(filter) : setFilter(0);
    // setSfv(() => (key, res) => {
    //   setFieldValue(key, res);
    // });
    setOpenKey(key);
    setOpen(true);

    console.log("PATTERN VARS:::", resolvePatternVars(match));
  };

  const handleClose = async (res: any) => {
    // setFilter(0);
    if (
      res &&
      res.lh_object_uid &&
      res.lh_object_name &&
      res.rel_type_uid &&
      res.rel_type_name &&
      res.rh_object_uid &&
      res.rh_object_name
    ) {
      if (openKey) {
        console.log("Setting field value", openKey, res);
        await setWorkflowKGValue(
          openKey,
          res.lh_object_uid,
          res.lh_object_name
        );
        const state = await getWorkflowState();
        processState(state);
      }
    }
    // setSfv(() => {});
    // setOpenKey("");
    setOpen(false);
  };

  const resolvePatternVars = (pattern: string[]) => {
    return pattern.map((fact) => {
      console.log("fact", fact);
      console.log("context", context);
      return fact.replace(
        /(\d+)\.([^>]+?)(\?)?(?=\s*>|$)/g,
        (match, p1, p2) => {
          const key = p2.trim();
          const contextItem = context ? context[key] : null;
          console.log("contextItem ", contextItem);
          console.log("match", match);
          console.log("p1", p1);
          console.log("p2", p2);
          console.log("context", context);
          console.log("key", key);
          if (contextItem && contextItem.uid && contextItem.value) {
            return `${contextItem.uid}.${contextItem.value}${
              match.endsWith(">") ? " >" : ""
            }`;
          }
          return match;
        }
      );
    });
    // return [];
  };

  return (
    <>
      <Modal
        open={open}
        onClose={() => {
          handleClose(null);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            bgcolor: "gray",
            border: "2px solid #000",
            p: 2,
          }}
        >
          <XXX
            filter={{ type: "should't matter, sucker", uid: filter }}
            callback={(res: any) => {
              handleClose(res);
            }}
            mode="query"
            readonly={true}
            autoload={true}
            initialQuery={resolvePatternVars(match).join("\n")}
            height="80vh"
          />
          <Button
            onClick={() => {
              handleClose(null);
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
      <Grid container spacing={2}>
        <Grid xs={1}>
          <Box>{workflowsList}</Box>
        </Grid>
        <Grid container spacing={2} xs={11}>
          {isComplete === true ? (
            <Grid xs={11}>
              <Box>Finished!</Box>
            </Grid>
          ) : (
            <>
              <Grid xs={2}>
                <ContextVisualizer context={context} />
              </Grid>
              <Grid xs={5}>
                <Box>{description}</Box>
                <Typography variant="h6">Match</Typography>
                <Box style={{ fontSize: 12 }}>
                  {match.map((p) => (
                    <Box>{p}</Box>
                  ))}
                </Box>
                <Typography variant="h6">Create</Typography>
                <Box style={{ fontSize: 12 }}>
                  {create.map((p) => (
                    <Box>{p}</Box>
                  ))}
                </Box>
                {nextEvents.map((event) => (
                  <Button
                    onClick={async () => {
                      console.log("event", event);
                      await incrementWorkflowStep(event);
                      const state = await getWorkflowState();
                      processState(state);
                    }}
                  >
                    {event}
                  </Button>
                ))}
                <Box>{inputs}</Box>
              </Grid>
            </>
          )}

          <Grid xs={5}>
            <WorkflowFactsVisualizer facts={facts} />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default Workflows;
