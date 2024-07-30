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
} from "../CCClient";

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
        <div>
          <input type="text" placeholder={fs.field} />
        </div>
      );
    } else if (fs.source === "knowledge-graph") {
      return (
        <div>
          <input type="text" placeholder={fs.field} />
        </div>
      );
    } else if (fs.source === "knowledge-graph | workflow") {
      return (
        <div>
          <input type="text" placeholder={fs.field} />
          <input type="text" placeholder={fs.workflowId} />
        </div>
      );
    }
  });

  const workflowsList = Object.keys(workflows).map((k) => (
    <div
      onClick={() => {
        handleWorkflowClick(k);
      }}
    >
      {k}
    </div>
  ));

  return (
    <div>
      <div>{workflowsList}</div>
      <hr />
      <div>{id}</div>
      <div>{description}</div>
      <div>
        {pattern.map((fact) => (
          <div>{fact}</div>
        ))}
      </div>
      <div>{inputs}</div>
      <div>
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
      </div>
    </div>
  );

  // <div>{fieldSources}</div>
};

export default Workflows;
