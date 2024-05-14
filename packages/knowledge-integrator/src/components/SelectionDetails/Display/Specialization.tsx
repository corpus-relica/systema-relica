import React, { useContext } from "react";
import { FormDown, FormNext } from "grommet-icons";
import { Box, Button, Text } from "grommet";
import { observer } from "mobx-react";
import RootStoreContext from "../../../context/RootStoreContext";
import { toJS } from "mobx";
import { sockSendCC } from "../../../socket";

interface SpecializationProps {
  uids: number[]; // specify the correct type instead of any if possible
  childUID: number;
}

const Specialization: React.FC<SpecializationProps> = observer(
  ({ uids, childUID }) => {
    const { semanticModelStore } = useContext(RootStoreContext);

    const handleUIDClick = (uid: number) => {
      sockSendCC("user", "loadEntity", { uid: uid });
      sockSendCC("user", "loadEntity", { uid: childUID });
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

export default Specialization;
