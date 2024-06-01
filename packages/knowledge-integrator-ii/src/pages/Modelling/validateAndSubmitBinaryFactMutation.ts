import axios from "axios";
import {
  SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
  SUMBIT_BINARY_FACTS_ENDPOINT,
} from "@relica/constants";

export default (facts: any[]) => ({
  mutationFn: (fcts: any[]) => {
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
        "http://localhost:3000" + SUMBIT_BINARY_FACTS_ENDPOINT,
        foo
      );
      console.log("RESULT", result);
    }

    console.log("SUCCESS", success);
  },
});
