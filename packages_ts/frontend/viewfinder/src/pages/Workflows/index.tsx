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
} from "../../io/CCBaseClient.js";

import Step from "./Step";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Unstable_Grid2";

import WorkflowTreeVisualizer from "./WorkflowTreeVisualizer";
import WorkflowStackVisualizer from "./WorkflowStackVisualizer";
import WorkflowFactsVisualizer from "./WorkflowFactsVisualizer";
import ContextVisualizer from "./ContextVisualizer";

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [stack, setStack] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [context, setContext] = useState(null);
  const [tree, setTree] = useState([]);

  const [currentId, setCurrentId] = useState(null);
  const [facts, setFacts] = useState([]);

  const [state, setState] = useState({});

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
    let stacksAreEqual = true;
    if (stack.length !== res.length) {
      stacksAreEqual = false;
    } else {
      for (let i = 0; i < stack.length; i++) {
        if (stack[i] !== res[i]) {
          stacksAreEqual = false;
          break;
        }
      }
    }
    if (!stacksAreEqual) {
      setStack(res);
    }
  };

  const processState = (res: any) => {
    console.log("res", res);
    setState(res);
    res.context && setContext(res.context);

    res.stack && processStack(res.stack);

    res.isComplete !== undefined && setIsComplete(res.isComplete);
    res.workflow?.id && setCurrentId(res.workflow.id);
    res.tree && setTree(res.tree);
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

  return (
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
            <Grid xs={3}>
              <Stack divider={<Divider orientation="horizontal" flexItem />}>
                <Stack
                  direction={"row"}
                  spacing={2}
                  divider={<Divider orientation="vertical" flexItem />}
                >
                  <Box>
                    <WorkflowStackVisualizer stack={stack} />
                  </Box>
                  <Box>
                    <ContextVisualizer context={context} />
                  </Box>
                </Stack>
                <Box>TreeVisualization</Box>
                <Box>
                  <WorkflowTreeVisualizer tree={tree} currentId={currentId} />
                </Box>
              </Stack>
            </Grid>
            <Grid xs={4}>
              <Step state={state} processState={processState} />
            </Grid>
          </>
        )}

        <Grid xs={5}>
          <WorkflowFactsVisualizer facts={facts} />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Workflows;
