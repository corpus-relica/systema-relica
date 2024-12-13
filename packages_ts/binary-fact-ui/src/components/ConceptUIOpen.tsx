import React from "react";
import { Box, FormField, TextInput } from "grommet";
import ConceptUIOpenFactSearch from "./ConceptUIOpenFactSearch";
import ConceptUIOpenFilter from "./ConceptUIOpenFilter";
import { ConceptUIProps } from "./ConceptUI";

export interface ConceptFilter {
  type: string;
  uid: number;
}

interface ConceptUIOpenProps {
  config: OpenConceptConfig;
  onChange?: ({ uid, name }: { uid: number; name: string }) => void;
}

export interface OpenConceptConfig {
  type: "open";
  uid?: number;
  filter?: ConceptFilter;
}

// if the config is open (i.e. no uid or filter) then we'll launch fact-search ui
// atm the filter were dealing with is 'subtypes_of' i.e the full set of subtypes of a given type, recursive.
// but we could also have 'supertypes_of' or 'instances_of' or 'instances_of_subtype' or 'instances_of_supertype'
// other neighboorhood relations such as 'related_to' or 'related_to_subtype' or 'related_to_supertype' or 'related_to_instance'...etc.
// in which case we'd need to launch a different ui, at the least select list with the definitions for each candidate concept and a search box
// i.e. not the full fact-search ui

const ConceptUIOpen = ({ config, onChange }: ConceptUIOpenProps) => {
  const { uid, filter } = config;

  if (!filter && !uid) {
    return <ConceptUIOpenFactSearch onChange={onChange} />;
  } else if (filter) {
    return <ConceptUIOpenFilter filter={filter} onChange={onChange} />;
  }
};

export default ConceptUIOpen;
