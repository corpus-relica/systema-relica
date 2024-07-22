import axios from "axios";
import {
  SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
  SUBMIT_BINARY_FACTS_ENDPOINT,
} from "@relica/constants";

export default (facts: any[], setSubmissionStatus?: any) => ({
  mutationFn: (fcts: any[]) => {
    if (setSubmissionStatus) setSubmissionStatus("pending");

    // before sending them to the server
    const foo = fcts.map((fact) => {
      return {
        ...fact,
        lh_object_uid: parseInt(fact.lh_object_uid),
        fact_uid: parseInt(fact.fact_uid),
        rel_type_uid: parseInt(fact.rel_type_uid),
        rh_object_uid: parseInt(fact.rh_object_uid),
        uom_uid: parseInt(fact.uom_uid),
      };
    });

    return axios.post(
      "http://localhost:3000" + SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
      foo
    );
  },
  onSuccess: (data, variables, context) => {
    if (setSubmissionStatus) setSubmissionStatus("success");
    const success = data.data.reduce((acc: boolean, result: any) => {
      return acc && result.isValid;
    }, true);

    if (!success) {
      console.error("ERROR", data.data);
    } else {
      console.log("SUCCESS", success);
      //submit the facts

      const foo = facts.map((fact) => {
        return {
          ...fact,
          lh_object_uid: parseInt(fact.lh_object_uid),
          fact_uid: parseInt(fact.fact_uid),
          rel_type_uid: parseInt(fact.rel_type_uid),
          rh_object_uid: parseInt(fact.rh_object_uid),
          uom_uid: parseInt(fact.uom_uid),
        };
      });
      const result = axios.post(
        "http://localhost:3000" + SUBMIT_BINARY_FACTS_ENDPOINT,
        foo
      );
      console.log("RESULT", result);
    }

    console.log("SUCCESS", success);
  },
  onError: (error, variables, context) => {
    if (setSubmissionStatus) setSubmissionStatus("error");
    console.error("ERROR", error);
  },
});
