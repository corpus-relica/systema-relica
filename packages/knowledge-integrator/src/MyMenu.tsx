import { Menu } from "react-admin";
import LabelIcon from "@mui/icons-material/Label";

export const MyMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItem name="db/kinds" />
    <Menu.Item to="env/graph" primaryText="Graph" leftIcon={<LabelIcon />} />
    <Menu.Item
      to="/modelling"
      primaryText="Modelling"
      leftIcon={<LabelIcon />}
    />
  </Menu>
);
