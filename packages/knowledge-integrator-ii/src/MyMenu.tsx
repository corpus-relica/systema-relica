import { Menu } from "react-admin";
import LabelIcon from "@mui/icons-material/Label";

export const MyMenu = () => (
    <Menu>
        <Menu.DashboardItem />
        <Menu.ResourceItem name="kinds" />
        <Menu.Item to="/graph" primaryText="Graph" leftIcon={<LabelIcon />} />
    </Menu>
);
