import React, { useState, useEffect } from "react";
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
} from "../../../io/CCBaseClient.js";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

const PendingStep = (props: any) => {
  const { state, processState } = props;
  const { workflow, context, isComplete, stack } = state;
  const { isFinalStep } = workflow;

  const [description, setDescription] = useState("");
  const [id, setId] = useState("");
  const [pattern, setPattern] = useState([]);
  const [fieldSources, setFieldSources] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState("none");

  const processStepState = (res: any) => {
    setId(res.id);
    setDescription(res.description);
    setPattern(res.match); //pattern);
    setFieldSources(res.fieldSources);
  };

  useEffect(() => {
    workflow && processStepState(workflow.currentStep);
    workflow && setWorkflowStatus(workflow.status);
  }, [state]);

  if (isComplete === true) return <Box>Finished!</Box>;

  const relevantFieldSources = fieldSources.filter((fs: any) => {
    return (
      fs.source === "context" ||
      fs.source === "knowledge-graph" ||
      fs.source === "knowledge-graph | workflow"
    );
  });

  const inputs = relevantFieldSources.map((fs: any) => {
    return (
      <Box key={fs.field}>
        {context && context[fs.field].uid}:{fs.field}:
        {context && context[fs.field].value}
      </Box>
    );
  });

  return (
    <Stack
      direction={"column"}
      divider={<Divider orientation="horizontal" flexItem />}
      spacing={2}
    >
      <Box>
        <h4>{workflowStatus}</h4>
      </Box>
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
            const res = await decrementWorkflowStep(workflow.id);
            const state = await getWorkflowState();
            processState(state);
          }}
        >
          REOPEN
        </Button>
        {stack.length > 1 ? (
          <Button
            onClick={async () => {
              const res = await popWorkflow();
              const state = await getWorkflowState();
              processState(state);
            }}
          >
            POP
          </Button>
        ) : (
          <Button
            onClick={async () => {
              const res = await finalizeWorkflow();
              const state = await getWorkflowState();
              processState(state);
            }}
          >
            FINALIZE
          </Button>
        )}
      </Box>
    </Stack>
  );
};

export default PendingStep;
