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
  commitWorkflow,
  setWorkflowValue,
} from "../../CCClient";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

import WorkflowTreeVisualizer from "./WorkflowTreeVisualizer";
import WorkflowStackVisualizer from "./WorkflowStackVisualizer";
import ContextVisualizer from "./ContextVisualizer";

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [workflowId, setWorkflowId] = useState("");
  const [description, setDescription] = useState("");
  const [id, setId] = useState("");
  const [pattern, setPattern] = useState([]);
  const [fieldSources, setFieldSources] = useState([]);
  const [stack, setStack] = useState([]);
  const [isFinalStep, setIsFinalStep] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const init = async () => {
      const workflows = await getWorkflows();
      setWorkflows(workflows);
      const state = await getWorkflowState();
      processState(state);
    };
    init();
  }, []);

  const processStepState = (res: any) => {
    setId(res.id);
    setDescription(res.description);
    setPattern(res.pattern);
    setFieldSources(res.fieldSources);
  };

  const processStackState = (res: any) => {
    setStack(res);
  };

  const processState = (res: any) => {
    res.workflow && processStepState(res.workflow.currentStep);
    res.workflow && setIsFinalStep(res.workflow.isFinalStep);
    res.context && setContext(res.context);
    res.stack && processStackState(res.stack);
    res.isComplete && setIsComplete(res.isComplete);
  };

  if (isComplete === true) return <Box>Finished!</Box>;

  const handleWorkflowClick = async (workflowId: any) => {
    setWorkflowId(workflowId);
    const firstStep = await initWorkflow(workflowId);
    const state = await getWorkflowState();
    processState(state);
  };

  const handleWorkflowButtonClick = async (workflowId: string) => {
    const firstStep = await branchWorkflow(workflowId);
    const state = await getWorkflowState();
    processState(state);
  };

  const relevantFieldSources = fieldSources.filter((fs: any) => {
    return (
      fs.source === "free" ||
      fs.source === "knowledge-graph" ||
      fs.source === "knowledge-graph | workflow"
    );
  });

  const inputs = relevantFieldSources.map((fs: any) => {
    if (fs.source === "free") {
      console.log("RERENDER THIS, WHY NOT???");
      return (
        <Box key={fs.field}>
          FREE:{" "}
          <input
            type="text"
            onChange={async (e) => {
              await setWorkflowValue(fs.field, e.target.value);
              const state = await getWorkflowState();
              processState(state);
              console.log(state);
            }}
            value={(context && context[fs.field]) || ""}
            placeholder={fs.field}
          />
        </Box>
      );
    } else if (fs.source === "knowledge-graph") {
      return (
        <Box key={fs.field}>
          KG:{" "}
          <input
            type="text"
            onChange={async (e) => {
              await setWorkflowValue(fs.field, e.target.value);
              const state = await getWorkflowState();
              processState(state);
            }}
            value={(context && context[fs.field]) || ""}
            placeholder={fs.field}
          />
        </Box>
      );
    } else if (fs.source === "knowledge-graph | workflow") {
      return (
        <Box key={fs.field}>
          KG:{" "}
          <input
            type="text"
            onChange={async (e) => {
              await setWorkflowValue(fs.field, e.target.value);
              const state = await getWorkflowState();
              processState(state);
            }}
            value={(context && context[fs.field]) || ""}
            placeholder={fs.field}
          />
          <Button
            onClick={() => {
              handleWorkflowButtonClick(fs.workflowId);
            }}
          >
            Create New {fs.workflowId}
          </Button>
        </Box>
      );
    }
  });

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
    <Stack
      direction={"row"}
      divider={<Divider orientation="vertical" flexItem />}
      spacing={2}
    >
      <Box>
        <Stack divider={<Divider orientation="horizontal" flexItem />}>
          <Box>{workflowsList}</Box>
          <Box>
            <ContextVisualizer context={context} />
          </Box>
        </Stack>
      </Box>
      <Box>
        <Stack divider={<Divider orientation="horizontal" flexItem />}>
          <Box>
            <WorkflowStackVisualizer stack={stack} />
          </Box>
          <Box>
            <WorkflowTreeVisualizer />
          </Box>
        </Stack>
      </Box>
      <Box>
        <Box>{id}</Box>
        <Box>{description}</Box>
        <Box>
          {pattern.map((fact) => (
            <Box key={fact}>{fact}</Box>
          ))}
        </Box>
        <Box>{inputs}</Box>
        <Box>
          <Button
            onClick={async () => {
              const res = await decrementWorkflowStep(workflowId);
              const state = await getWorkflowState();
              processState(state);
            }}
          >
            Back
          </Button>
          {isFinalStep ? (
            <Button
              onClick={async () => {
                const res = await commitWorkflow();
                const state = await getWorkflowState();
                processState(state);
              }}
            >
              End
            </Button>
          ) : (
            <Button
              onClick={async () => {
                const res = await incrementWorkflowStep(workflowId);
                const state = await getWorkflowState();
                processState(state);
              }}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Stack>
  );
};

export default Workflows;
