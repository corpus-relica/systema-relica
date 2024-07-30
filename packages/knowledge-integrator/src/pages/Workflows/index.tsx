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
} from "../../CCClient";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

import WorkflowTreeVisualizer from "./WorkflowTreeVisualizer";
import WorkflowStackVisualizer from "./WorkflowStackVisualizer";

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [workflowId, setWorkflowId] = useState("");
  const [description, setDescription] = useState("");
  const [id, setId] = useState("");
  const [pattern, setPattern] = useState([]);
  const [fieldSources, setFieldSources] = useState([]);
  const [stack, setStack] = useState([]);

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
    res.currentStep && processStepState(res.currentStep);
    res.stack && processStackState(res.stack);
  };

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

  console.log("workflows");
  console.log(fieldSources);
  const relavantFieldSources = fieldSources.filter((fs: any) => {
    return (
      fs.source === "free" ||
      fs.source === "knowledge-graph" ||
      fs.source === "knowledge-graph | workflow"
    );
  });

  const inputs = relavantFieldSources.map((fs: any) => {
    if (fs.source === "free") {
      return (
        <Box key={fs.field}>
          <input type="text" placeholder={fs.field} />
        </Box>
      );
    } else if (fs.source === "knowledge-graph") {
      return (
        <Box key={fs.field}>
          <input type="text" placeholder={fs.field} />
        </Box>
      );
    } else if (fs.source === "knowledge-graph | workflow") {
      return (
        <Box key={fs.field}>
          <input type="text" placeholder={fs.field} />
          <Button
            onClick={() => {
              handleWorkflowButtonClick(fs.workflowId);
            }}
          >
            {fs.workflowId}
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
          <Box>environment</Box>
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
            <Box>{fact}</Box>
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
          <Button
            onClick={async () => {
              const res = await incrementWorkflowStep(workflowId);
              const state = await getWorkflowState();
              processState(state);
            }}
          >
            Next
          </Button>
        </Box>
      </Box>
    </Stack>
  );

  // <Box>{fieldSources}</Box>
};

export default Workflows;
