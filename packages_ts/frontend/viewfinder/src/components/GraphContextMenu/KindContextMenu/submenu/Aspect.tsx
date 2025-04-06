import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

interface KindContextAspectSubmenuProps {}

const KindContextAspectSubmenu: React.FC<KindContextAspectSubmenuProps> = (
  props
) => {
  return (
    <>
      <MenuItem disabled>:: Aspect ::</MenuItem>
      <MenuItem disabled>show possible possesors</MenuItem>
      {/*<MenuItem disabled>show info about quanitifaction</MenuItem>*/}
      {/*<MenuItem disabled>show info about qualifiactions</MenuItem>*/}
      {/*<MenuItem disabled>show info about UoM</MenuItem>*/}
    </>
  );
};

export default KindContextAspectSubmenu;
