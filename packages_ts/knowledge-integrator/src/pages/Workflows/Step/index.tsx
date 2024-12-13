import React, {
  useEffect,
  useState,
  memo,
  useCallback,
  useRef,
  useReducer,
} from "react";
import InProgressStep from "./InProgress";
import PendingStep from "./Pending";

const Step = (props: any) => {
  const { state, processState } = props;
  const { workflow } = state;
  let UI = null;
  if (workflow && workflow.status === "in-progress") {
    UI = <InProgressStep state={state} processState={processState} />;
  }
  if (workflow && workflow.status === "pending") {
    UI = <PendingStep state={state} processState={processState} />;
  }
  return <div>{UI}</div>;
};

export default Step;
