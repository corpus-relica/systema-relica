import { Menu } from "react-admin";
import { 
  Label as LabelIcon,
  TravelExplore as TravelExploreIcon,
  BlurCircular as BlurCircularIcon,
  Plumbing as PlumbingIcon,
  Foundation as FoundationIcon
} from "@mui/icons-material";

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
