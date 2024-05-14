import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grommet,
  Table,
  TableRow,
  TableBody,
  TableCell,
  Text,
} from "grommet";
import { grommet } from "grommet/themes";
import { Copy as CopyIcon } from "grommet-icons";
import ErrorBoundary from "../ErrorBoundary";
import { useStores } from "../../context/RootStoreContext";
import { observer } from "mobx-react";
import { retrieveIndividualModel } from "../../CCClient";
import { useQuery } from "@tanstack/react-query";

import Specialization from "./Display/Specialization";
import Classification from "./Display/Classification";
import Value from "./Display/Value";

import PossibleRole from "./Display/PossibleRole";
import { sockSendCC } from "../../socket";

const IntegerDetails: React.FC = observer(() => {
  const { graphViewStore } = useStores();
  const { selectedNode } = graphViewStore;

  if (!selectedNode) return <div>Loading...</div>;

  const customTheme = {
    ...grommet,
    dataTable: {
      ...grommet.dataTable,
      text: {
        size: "8px",
      },
    },
  };

  return (
    <Grommet theme={customTheme}>
      <Box
        direction="column"
        width="medium"
        gap="small"
        margin="none"
        pad="small"
      >
        <Box>
          <Box direction="row" align="center" justify="between">
            <Box>
              <Text size="18px" style={{ fontWeight: 800 }}>
                {selectedNode - 5000000000}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Grommet>
  );
});

export default IntegerDetails;
