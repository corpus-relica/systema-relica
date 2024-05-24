import React, { useState } from "react";
import { Box, Button, DataTable, Data, Text } from "grommet";
import { useStores } from "./context/RootStoreContext";
import { RootStore } from "./stores/RootStore";
import { observer } from "mobx-react-lite";
import cols from "./columns";
//@ts-ignore
import { Fact } from "@relica/types";
import { toJS } from "mobx";

const Body = observer((props: any) => {
  const { callback } = props;
  const rootStore: RootStore = useStores();
  const { facts } = rootStore;

  const handleSelectClick = (row: Fact) => {
    callback && callback(toJS(row));
  };

  const handleRowDetails = (row: Fact) => {
    return (
      <Box>
        <Box pad={{ left: "medium", right: "medium", bottom: "small" }}>
          <Text>{row["full_definition"]}</Text>
        </Box>
        <Box>
          <Button
            primary
            label="Select"
            onClick={() => {
              handleSelectClick(row);
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box pad="medium" basis="xxlarge" overflow={"auto"}>
      <Data data={facts}>
        <DataTable
          primaryKey="fact_uid"
          columns={cols}
          rowDetails={handleRowDetails}
        />
      </Data>
    </Box>
  );
});

export default Body;
