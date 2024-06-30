import React, { useState, useEffect } from "react";
import { useStore } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import { retrieveKindModel } from "../../CCClient";
import { sockSendCC } from "../../socket";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Specialization from "./display/Specialization";
import Definition from "./display/Definition";

const KindDetails: React.FC = () => {
  const [selectedNode] = useStore("selectedNode");

  const { isLoading, error, data } = useQuery({
    queryKey: ["kindModel", selectedNode],
    queryFn: () =>
      selectedNode
        ? retrieveKindModel(selectedNode).then((res) => res)
        : Promise.resolve(null),
    enabled: !!selectedNode, // This disables the query if selectedNode is null
  });

  if (!selectedNode) return <div>No node selected</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const { uid, type, category, name, definition, facts, collection } = data;
  const specialization = data[1146];
  const synonyms = data[1981];
  const inverses = data[1986];
  const reqRole1 = data[4731];
  const reqRole2 = data[4733];
  const possRoles = data[4714];

  const loadAllPossRoles = (uid) => {
    possRoles.forEach((possRole) => {
      sockSendCC("user", "loadEntity", { uid: possRole });
    });
  };

  const pushDataToClipboard = async () => {
    await window.navigator.clipboard.writeText(JSON.stringify(data));
  };

  const text = `${uid} (${type}) :: ${name}`;
  // const factTableRows = facts.map((fact) => {
  //   return (
  //     <TableRow>
  //       <TableCell>
  //         <Text size="10px">{fact.lh_object_name}</Text>
  //       </TableCell>
  //       <TableCell>
  //         <Text size="10px">{fact.rel_type_name}</Text>
  //       </TableCell>
  //       <TableCell>
  //         <Text size="10px">{fact.rh_object_name}</Text>
  //       </TableCell>
  //     </TableRow>
  //   );
  // });

  console.log("data: ", data);

  return (
    <Stack direction="column" spacing="1">
      <Box>
        <Stack direction="row" spacing="1">
          <Box>
            <Typography size="18px" style={{ fontWeight: 800, color: "black" }}>
              {text}
            </Typography>
            <Typography size="12px" style={{ fontWeight: 500, color: "black" }}>
              Specialization:
            </Typography>
            {specialization && specialization.length > 0 && (
              <Specialization uids={specialization} childUID={uid} />
            )}
          </Box>
          <IconButton aria-label="copy to clipboard">
            <CopyAllIcon onClick={pushDataToClipboard} />
          </IconButton>
        </Stack>
        {category && (
          <Stack direction="row" spacing="1">
            <Typography size="12px" style={{ fontWeight: 600 }}>
              Category:
            </Typography>
            <Typography size="12px">{category}</Typography>
          </Stack>
        )}
        {definition && <Definition definitions={definition} />}
      </Box>
    </Stack>
  );
};

export default KindDetails;

// <Box
//   sx={{
//     flexDirection: "column",
//     width: "384px",
//   }}
// >
//   <Box>
//     <Box sx={{ flexDirection: "row" }}>
//       <Box></Box>
//       <Button onClick={pushDataToClipboard} variant="outlined">
//         push to clipboard
//       </Button>
//     </Box>
//   </Box>
// </Box>
