import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

interface KindContextPhysicalObjectSubmenuProps {}

const KindContextPhysicalObjectSubmenu: React.FC<
  KindContextPhysicalObjectSubmenuProps
> = (props) => {
  return (
    <>
      <MenuItem disabled>:: Physical Object ::</MenuItem>
      <MenuItem disabled>show possible aspect</MenuItem>
      <MenuItem disabled>show possible roles</MenuItem>
      <MenuItem disabled>show possible involvement</MenuItem>
    </>
  );
};

export default KindContextPhysicalObjectSubmenu;
