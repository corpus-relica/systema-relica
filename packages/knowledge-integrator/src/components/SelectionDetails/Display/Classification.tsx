import React, { useContext } from "react";
import { FormDown, FormNext } from "grommet-icons";
import { Box, Button, Text } from "grommet";
import { observer } from "mobx-react";
import RootStoreContext from "../../../context/RootStoreContext";
import { toJS } from "mobx";
import { sockSendCC } from "../../../socket";

interface ClassificationProps {
  uids: number[];
  individualUID: number;
}

const Classification: React.FC<ClassificationProps> = observer(
  ({ uids, individualUID }) => {
    const { semanticModelStore } = useContext(RootStoreContext);

    const handleUIDClick = (uid: number) => {
      sockSendCC("user", "loadEntity", { uid: uid });
      sockSendCC("user", "loadEntity", { uid: individualUID });
    };

    const ui = uids.map((uid, index) => {
      const model = semanticModelStore.models.get(uid);
      console.log(toJS(model));
      if (model) {
        return <Text size="xsmall">{model.name}</Text>;
      } else {
        return (
          <Text
            size="xsmall"
            color="brand"
            onClick={handleUIDClick.bind(this, uid)}
          >
            {uid}
          </Text>
        );
      }
    });

    return (
      <Box direction="column" align="start">
        {ui}
      </Box>
    );
  }
);

export default Classification;
