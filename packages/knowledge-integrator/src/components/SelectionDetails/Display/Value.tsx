import React, { useContext } from "react";
import { FormDown, FormNext } from "grommet-icons";
import { Box, Button, Text } from "grommet";
import { useStores } from "../../../context/RootStoreContext";
import { observer } from "mobx-react";
import RootStoreContext from "../../../context/RootStoreContext";
import { toJS } from "mobx";
import { sockSendCC } from "../../../socket";

interface ValueProps {
  value: { quant: number; uom: { uid: number; name: string } };
}

const Value: React.FC<ValueProps> = observer(({ value }) => {
  const { graphViewStore } = useStores();
  const { selectNode } = graphViewStore;
  const { semanticModelStore } = useContext(RootStoreContext);

  //TODO: consolidate this kind of behavior; see also Headert.tsx (and maybe GraphContexMenu.tsx)
  // i.e. fold in somesort of action/command pattern
  const performRequest = async () => {
    sockSendCC("user", "getSpecializationHierarchy", { uid: value.uom.uid });
  };

  return (
    <Box direction="row" align="start">
      <Text>{value.quant}</Text>
      <Text color="brand" onClick={performRequest}>
        {value.uom.name}
      </Text>
    </Box>
  );
});

export default Value;
