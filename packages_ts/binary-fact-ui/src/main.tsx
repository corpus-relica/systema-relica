import React from "react";
import ReactDOM from "react-dom/client";
import App, { FactConfig } from "./App.tsx";
//import './index.css'
// @ts-ignore
import { Fact } from "@relica/types";
import ConceptUI from "./components/ConceptUI";

const config: FactConfig = {
  lh: { type: "temp", uid: 1 },
  rel: { type: "fixed", uid: 1146 },
  rh: { type: "open", filter: { type: "subtypes_of", uid: 730044 } },
};

const config2: FactConfig = {
  lh: { type: "temp", uid: 101 },
  rel: { type: "fixed", uid: 1981 },
  rh: { type: "temp", uid: 101, name: "test" },
};

const config3: FactConfig = {
  lh: { type: "temp", uid: 101, name: "test" },
  rel: { type: "fixed", uid: 5283 },
  rh: { type: "open", filter: { type: "subtypes_of", uid: 1229 } },
};

const config4: FactConfig = {
  lh: { type: "open" },
  rel: { type: "fixed", uid: 5283 },
  rh: { type: "open" },
};

const setFact = (fact: Fact) => {
  console.log(fact);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App config={config} setFact={setFact} />
    <App config={config2} setFact={setFact} />
    <App config={config3} setFact={setFact} />
    <App config={config4} setFact={setFact} />
  </React.StrictMode>
);
