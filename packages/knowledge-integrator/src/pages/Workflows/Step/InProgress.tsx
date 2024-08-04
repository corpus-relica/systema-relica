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
} from "../../../CCClient";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

const InProgressStep = (props: any) => {
  const { state, processState } = props;
  const { workflow, context, isComplete } = state;
  const { isFinalStep } = workflow;

  const [description, setDescription] = useState("");
  const [id, setId] = useState("");
  const [pattern, setPattern] = useState([]);
  const [fieldSources, setFieldSources] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState("none");

  const processStepState = (res: any) => {
    if (res) {
      setId(res.id);
      setDescription(res.description);
      setPattern(res.pattern);
      setFieldSources(res.fieldSources);
    }
  };

  useEffect(() => {
    workflow && processStepState(workflow.currentStep);
    workflow && setWorkflowStatus(workflow.status);
  }, [state]);

  if (isComplete === true) return <Box>Finished!</Box>;

  const handleWorkflowButtonClick = async (
    fieldId: string,
    workflowId: string
  ) => {
    console.log("handleWorkflowButtonClick", fieldId, workflowId);
    const firstStep = await branchWorkflow(fieldId, workflowId);
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
              handleWorkflowButtonClick(fs.field, fs.workflowId);
            }}
          >
            Create New {fs.workflowId}
          </Button>
        </Box>
      );
    }
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
          Back
        </Button>
        {isFinalStep ? (
          <Button
            onClick={async () => {
              const res = await validateWorkflow();
              const state = await getWorkflowState();
              processState(state);
            }}
          >
            End
          </Button>
        ) : (
          <Button
            onClick={async () => {
              const res = await incrementWorkflowStep(workflow.id);
              const state = await getWorkflowState();
              processState(state);
            }}
          >
            Next
          </Button>
        )}
      </Box>
    </Stack>
  );
};

export default InProgressStep;
