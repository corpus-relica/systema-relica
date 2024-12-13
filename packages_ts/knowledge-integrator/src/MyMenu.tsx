import { Menu } from "react-admin";
import LabelIcon from "@mui/icons-material/Label";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import BlurCircularIcon from "@mui/icons-material/BlurCircular";
import PlumbingIcon from "@mui/icons-material/Plumbing";
import FoundationIcon from "@mui/icons-material/Foundation";

export const MyMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItem name="db/kinds" />
    <Menu.Item
      to="env/graph"
      primaryText="Graph"
      leftIcon={<BlurCircularIcon />}
    />
    <Menu.Item
      to="/modelling"
      primaryText="Modelling"
      leftIcon={<PlumbingIcon />}
    />
    <Menu.Item
      to="/workflows"
      primaryText="Workflows"
      leftIcon={<FoundationIcon />}
    />
  </Menu>
);
