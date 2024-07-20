import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

interface KindContextRoleSubmenuProps {}

const KindContextRoleSubmenu: React.FC<KindContextRoleSubmenuProps> = (
  props
) => {
  return (
    <>
      <MenuItem disabled>:: Role ::</MenuItem>
      <MenuItem disabled>show role players</MenuItem>
      <MenuItem disabled>show requiring relations</MenuItem>
    </>
  );
};

export default KindContextRoleSubmenu;
