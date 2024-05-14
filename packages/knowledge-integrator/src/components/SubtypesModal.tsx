import React, { useRef, useEffect, useContext, useState } from "react";
import { Drop, Box, Menu, Text, Layer, Button, CheckBoxGroup } from "grommet";
import { observer } from "mobx-react";
import RootStoreContext from "../context/RootStoreContext";
import { Fact } from "../types";

interface SubtypesModalProps {
  uid: number;
  subtypes: Array<Fact>;
  existingSubtypes: Array<number>;
  handleClose: () => void;
  handleOk: (selected: number[], notSelected: number[]) => void;
}

const SubtypesModal: React.FC<SubtypesModalProps> = ({
  uid,
  subtypes,
  existingSubtypes,
  handleClose,
  handleOk,
}) => {
  // const { graphViewStore, factDataStore } = useContext(RootStoreContext);
  // const { contextMenuFocus } = graphViewStore;
  // const { x, y, uid } = contextMenuFocus;
  const [value, setValue] = useState(existingSubtypes);

  console.log("SubtypesModal: uid", uid);
  console.log("existingSubtypes", existingSubtypes);

  const objs = subtypes.map((fact) => {
    const { lh_object_uid, lh_object_name } = fact;
    return { lh_object_uid, lh_object_name };
  });

  const alphaSortedObjs = objs.sort((a, b) => {
    if (a.lh_object_name < b.lh_object_name) {
      return -1;
    }
    if (a.lh_object_name > b.lh_object_name) {
      return 1;
    }
    return 0;
  });

  // const subtypesElems = alphaSortedObjs.map((fact) => {
  //   const { lh_object_uid, lh_object_name } = fact;
  //   const labelTxt = `${lh_object_name} (${lh_object_uid})`;
  //   return (
  //     <Box key={lh_object_uid} direction="row" pad="none" margin="none">
  //       <CheckBox label={labelTxt} value={lh_object_uid} pad="none" />
  //     </Box>
  //   );
  // });
  const subtypesElems = (
    <CheckBoxGroup
      options={alphaSortedObjs}
      labelKey="lh_object_name"
      valueKey="lh_object_uid"
      onChange={({ value: nextValue, option }) => {
        setValue(nextValue as any);
      }}
      value={value}
    />
  );

  return (
    <Layer>
      <Box height="medium" width="medium" pad="small" margin="xsmall">
        <Box basis="1" pad="medium">
          <Text>subtypes {uid}:</Text>
        </Box>
        <Box basis="1" overflow="auto" pad="xsmall" gap="medium">
          {subtypesElems}
        </Box>
        <Box basis="1" direction="row-reverse" gap="medium" pad="small">
          <Button onClick={handleClose}>Close</Button>
          <Button
            onClick={() => {
              let notChecked = alphaSortedObjs.filter(
                (obj) => !value.includes(obj.lh_object_uid),
              );
              handleOk(
                value,
                notChecked.map((obj) => obj.lh_object_uid),
              );
            }}
          >
            OK
          </Button>
        </Box>
      </Box>
    </Layer>
  );
};

export default SubtypesModal;
