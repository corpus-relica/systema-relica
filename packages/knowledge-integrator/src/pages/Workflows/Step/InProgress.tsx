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
  setWorkflowKGValue,
} from "../../../CCClient";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";

import XXX from "@relica/fact-search-ui";

interface ContextItem {
  uid: number;
  value: string;
}

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

const InProgressStep = (props: any) => {
  const { state, processState } = props;
  const { workflow, context, isComplete } = state;
  const { isFinalStep } = workflow;

  const [description, setDescription] = useState("");
  const [id, setId] = useState("");
  const [pattern, setPattern] = useState([]);
  const [fieldSources, setFieldSources] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState("none");

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<number>(0);
  const [openKey, setOpenKey] = useState("");

  const processStepState = (res: any) => {
    if (res) {
      setId(res.id);
      setDescription(res.description);
      setPattern(res.match); //pattern);
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
      fs.source === "context" ||
      fs.source === "knowledge-graph" ||
      fs.source === "knowledge-graph | workflow"
    );
  });

  const handleOpen = (key: string, filter: number = 0) => {
    filter !== 730000 ? setFilter(filter) : setFilter(0);
    // setSfv(() => (key, res) => {
    //   setFieldValue(key, res);
    // });
    setOpenKey(key);
    setOpen(true);
  };

  const handleClose = async (res: any) => {
    setFilter(0);
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
        setWorkflowKGValue(openKey, res.lh_object_uid, res.lh_object_name);

        const state = await getWorkflowState();
        processState(state);
      }
    }
    // setSfv(() => {});
    // setOpenKey("");
    setOpen(false);
  };

  const inputs = relevantFieldSources.map((fs: any) => {
    if (fs.source === "context") {
      return (
        <Box key={fs.field}>
          {fs.field}(FREE):
          <input
            type="text"
            value={(context && context[fs.field].value) || ""}
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
            value={(context && context[fs.field].value) || ""}
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
            value={(context && context[fs.field].value) || ""}
            handleOpen={() => {
              handleOpen(fs.field);
            }}
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

  const resolvePatternVars = (pattern: string[]) => {
    return pattern.map((fact) => {
      console.log("fact", fact);
      console.log("context", context);
      return fact.replace(/\?(\d+)\.([^>]+?)(?:\s*>|$)/g, (match, p1, p2) => {
        const key = p2.trim();
        const contextItem = context[key];
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
      });
    });
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
            initialQuery={resolvePatternVars(pattern).join("\n")}
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
    </>
  );
};

export default InProgressStep;
