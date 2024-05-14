import React, { useState } from "react";
import { Box, Button, Footer, Layer } from "grommet";
import FactSearch from "@relica/fact-search";

const FactTable = (props) => {
  const { factTableIsOpen, setFactTableIsOpen, callback } = props;
  const close = () => setFactTableIsOpen(false);

  return (
    <>
      {factTableIsOpen && (
        <Layer onClickOutside={close} onEsc={close}>
          <Box pad="small" background="light-2" elevation="medium">
            <FactSearch callback={callback} />
            <Footer pad="medium" justify="end">
              <Button label="Close" onClick={close} />
            </Footer>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default FactTable;
