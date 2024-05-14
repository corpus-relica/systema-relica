import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
//@ts-ignore
import { Fact } from "@relica/types";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App
      callback={(f: Fact) => {
        console.log("callback", f);
      }}
    />
  </React.StrictMode>
);
