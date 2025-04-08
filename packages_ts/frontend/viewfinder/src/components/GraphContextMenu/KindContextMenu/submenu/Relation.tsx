import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

interface KindContextRelationSubmenuProps {}

const KindContextRelationSubmenu: React.FC<KindContextRelationSubmenuProps> = (
  props
) => {
  return (
    <>
      <MenuItem disabled>:: Relation ::</MenuItem>
      <MenuItem disabled>show required roles</MenuItem>
    </>
  );
};

export default KindContextRelationSubmenu;
