import axios from "axios";
import {
  SIMPLE_VALIDATE_BINARY_FACTS_ENDPOINT,
  SUBMIT_BINARY_FACTS_ENDPOINT,
  SUBMIT_DATE_ENDPOINT,
} from "@relica/constants";

export default (facts: any[]) => ({
  mutationFn: (fcts: any[]) => {
    // before sending them to the server
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
    // this is a total hack!!!
    const bar = {
      date_uid: foo[0].lh_object_uid,
      collection_uid: foo[0].collection_uid,
      collection_name: foo[0].collection_name,
    };
    return axios.post("http://localhost:3000" + SUBMIT_DATE_ENDPOINT, bar);
  },
  onSuccess: (data, variables, context) => {
    // const success = data.data.reduce((acc: boolean, result: any) => {
    //   return acc && result.isValid;
    // }, true);
    // if (!success) {
    //   console.error("ERROR", data.data);
    // } else {
    //   console.log("SUCCESS", success);
    //   //submit the facts
    // }
    // console.log("SUCCESS", success);
  },
});
