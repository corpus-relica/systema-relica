import React from "react";
import { FormDown, FormNext } from "grommet-icons";
import { Box, Button, Text } from "grommet";

const MenuButton = ({ label, open, submenu, ...rest }) => {
  const Icon = open ? FormDown : FormNext;
  return (
    <Button hoverIndicator="background" {...rest}>
      <Box
        margin={submenu ? { left: "small" } : undefined}
        direction="row"
        align="center"
      >
        <Icon color="brand" />
        <Text size="medium">{label}</Text>
      </Box>
    </Button>
  );
};

export default MenuButton;
