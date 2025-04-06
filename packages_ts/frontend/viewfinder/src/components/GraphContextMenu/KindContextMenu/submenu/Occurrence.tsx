import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";

interface KindContextOccurrenceSubmenuProps {}

const KindContextOccurrenceSubmenu: React.FC<
  KindContextOccurrenceSubmenuProps
> = (props) => {
  return (
    <>
      <MenuItem disabled>:: Occurrence ::</MenuItem>
      <MenuItem disabled>show involved</MenuItem>
    </>
  );
};

export default KindContextOccurrenceSubmenu;
