import React, { useState } from "react";
import {
  Box,
  Button,
  CheckBox,
  Form,
  FormField,
  MaskedInput,
  RadioButtonGroup,
  RangeInput,
  Select,
  TextArea,
  TextInput,
} from "grommet";
import ConceptUIFixed from "./ConceptUIFixed";
import ConceptUIOpen, {
  OpenConceptConfig,
  ConceptFilter,
} from "./ConceptUIOpen";
import ConceptUITemp from "./ConceptUITemp";

export interface ConceptUIProps {
  config: ConceptConfig;
  onChange?: ({ uid, name }: { uid: number; name: string }) => void;
}

export interface ConceptConfig {
  type: "temp" | "fixed" | "open";
  uid?: number;
  filter?: ConceptFilter;
  name?: string;
}

const ConceptUI = ({ config, onChange }: ConceptUIProps) => {
  const { type, uid, filter, name } = config;

  switch (type) {
    case "temp":
      if (uid === undefined) {
        return <div>error</div>;
      }
      return <ConceptUITemp uid={uid} name={name} onChange={onChange} />;
      break;
    case "fixed":
      if (uid === undefined) {
        return <div>error</div>;
      }
      return <ConceptUIFixed config={{ uid: uid }} onChange={onChange} />;
      break;
    case "open":
      return (
        <ConceptUIOpen
          config={config as OpenConceptConfig}
          onChange={onChange}
        />
      );
      break;
    default:
      //error
      return <div>error</div>;
      break;
  }
};

export default ConceptUI;
