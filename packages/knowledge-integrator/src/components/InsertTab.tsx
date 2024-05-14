import React from "react";
import { Box } from "grommet";
import BinaryFact from "./BinaryFact";
import RLCMemoForm from "./RLCMemoForm";

const InsertTab: React.FC = () => {
  return (
    <Box direction="row" border={true} gap="medium">
      <Box basis="large" border={true}>
        <BinaryFact />
      </Box>
      <Box basis="large" border={true}>
        <RLCMemoForm />
      </Box>
    </Box>
  );
};

export default InsertTab;
