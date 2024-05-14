import React, { useContext } from "react";
import { FormDown, FormNext } from "grommet-icons";
import { Box, Button, Text } from "grommet";
import { observer } from "mobx-react";
import RootStoreContext from "../../../context/RootStoreContext";
import { toJS } from "mobx";
import { sockSendCC } from "../../../socket";

interface PossibleRoleProps {
  uid: number; // specify the correct type instead of any if possible
  roleplayerUID: number;
}

const PossibleRole: React.FC<PossibleRoleProps> = observer(
  ({ uid, roleplayerUID }) => {
    const { semanticModelStore } = useContext(RootStoreContext);

    const handleUIDClick = (uid: number) => {
      sockSendCC("user", "loadEntity", { uid: uid });
    };

    const model = semanticModelStore.models.get(uid);

    let ui;
    if (model) {
      ui = <Text size="xsmall">{model.name}</Text>;
    } else {
      return (ui = (
        <Text
          size="xsmall"
          color="brand"
          onClick={handleUIDClick.bind(this, uid)}
        >
          {uid}
        </Text>
      ));
    }

    return (
      <Box direction="column" align="start">
        {ui}
      </Box>
    );
  }
);

export default PossibleRole;
