import React, { useState } from "react";
import { Box, Button, Footer, Layer } from "grommet";
//@ts-ignore
import FactSearch from "@relica/fact-search";

interface FactTableProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  callback: (fact: any) => void;
  filter?: { type: string; uid: number };
  initialQuery?: string;
}

const FactTable = (props: FactTableProps) => {
  const { isOpen, setIsOpen, callback, filter, initialQuery } = props;
  return (
    <>
      {isOpen && (
        <Layer>
          <Box pad="small" background="light-2">
            <FactSearch
              callback={callback}
              filter={filter}
              initialQuery={initialQuery}
            />
            <Footer pad="medium" justify="end">
              <Button label="Close" onClick={() => setIsOpen(false)} />
            </Footer>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default FactTable;
