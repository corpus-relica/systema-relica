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
  initWorkflow,
  incrementWorkflowStep,
  decrementWorkflowStep,
} from "../../CCClient";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

import TreeVizualization from "./TreeVizualization";

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [workflowId, setWorkflowId] = useState("");
  const [description, setDescription] = useState("");
  const [id, setId] = useState("");
  const [pattern, setPattern] = useState([]);
  const [fieldSources, setFieldSources] = useState([]);

  useEffect(() => {
    const init = async () => {
      const workflows = await getWorkflows();
      setWorkflows(workflows);
    };
    init();
  }, []);

  const processState = (res: any) => {
    setId(res.id);
    setDescription(res.description);
    setPattern(res.pattern);
    setFieldSources(res.fieldSources);
  };

  const handleWorkflowClick = async (workflowId: any) => {
    setWorkflowId(workflowId);
    const firstStep = await initWorkflow(workflowId);
    processState(firstStep);
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
        <Box>
          <input type="text" placeholder={fs.field} />
        </Box>
      );
    } else if (fs.source === "knowledge-graph") {
      return (
        <Box>
          <input type="text" placeholder={fs.field} />
        </Box>
      );
    } else if (fs.source === "knowledge-graph | workflow") {
      return (
        <Box>
          <input type="text" placeholder={fs.field} />
          <input type="text" placeholder={fs.workflowId} />
        </Box>
      );
    }
  });

  const workflowsList = Object.keys(workflows).map((k) => (
    <Box
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
          <Box>stack</Box>
          <Box>
            <TreeVizualization />
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
          <button
            onClick={async () => {
              const res = await decrementWorkflowStep(workflowId);
              processState(res);
            }}
          >
            Back
          </button>
          <button
            onClick={async () => {
              const res = await incrementWorkflowStep(workflowId);
              processState(res);
            }}
          >
            Next
          </button>
        </Box>
      </Box>
    </Stack>
  );

  // <Box>{fieldSources}</Box>
};

export default Workflows;
