import React, { useState, useEffect } from "react";
import { useStore } from "react-admin";
import { useQuery } from "@tanstack/react-query";

import { retrieveKindModel } from "../../../CCClient.js";

import { sockSendCC } from "../../../socket.js";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import Specialization from "../display/Specialization.js";
import Definition from "../display/Definition.js";
import PossibleRole from "../display/PossibleRole.js";
import WorkflowFactsVisualizer from "../../../pages/Workflows/WorkflowFactsVisualizer.js";
import Synonyms from "../display/Synonyms.js";

import PhysicalObjectKindDetails from "./PhysicalObject.js";
import AspectKindDetails from "./Aspect.js";
import RoleKindDetails from "./Role.js";
import RelationKindDetails from "./Relation.js";
import OccurrenceKindDetails from "./Occurrence.js";

const KindDetails: React.FC = () => {
  const [selectedNode] = useStore("selectedNode");

  const { isLoading, error, data } = useQuery({
    queryKey: ["kindModel", selectedNode],
    queryFn: () =>
      selectedNode
        ? retrieveKindModel(selectedNode).then((res) => res.kind)
        : Promise.resolve(null),
    enabled: !!selectedNode, // This disables the query if selectedNode is null
  });

  if (!selectedNode) return <div>No node selected</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const { uid, name, nature, category, supertypes, definitions, synonyms } =
    data;

  if (!definitions) return <div>No definitions found</div>;

  const tempDefs = definitions.map((def) => ({
    full_definition: def,
    partial_definition: "",
  }));
  const defsComp = <Definition definitions={tempDefs} />;
  const specComp = <Specialization uids={supertypes} childUID={uid} />;

  let catComp;
  switch (category) {
    case "physical object":
      catComp = <PhysicalObjectKindDetails {...data} />;
      break;
    case "aspect":
      catComp = <AspectKindDetails {...data} />;
      break;
    case "role":
      catComp = <RoleKindDetails {...data} />;
      break;
    case "relation":
      catComp = <RelationKindDetails {...data} />;
      break;
    case "occurrence":
      catComp = <OccurrenceKindDetails {...data} />;
      break;
    default:
      catComp = <div>Unknown Entity Category: {category}</div>;
      break;
  }

  // <Typography size="18px" style={{ fontWeight: 800, color: "black" }}>
  //   {category}
  // </Typography>

  // const synFacts = facts.filter((fact) => fact.rel_type_uid === 1981);

  // const specialization = data[1146];
  // const synonyms = data[1981];
  // const inverses = data[1986];
  // const reqRole1 = data[4731];
  // const reqRole2 = data[4733];
  // const possRoles = data[4714];

  // const loadAllPossRoles = (uid) => {
  //   possRoles.forEach((possRole) => {
  //     sockSendCC("user", "loadEntity", { uid: possRole });
  //   });
  // };

  // const pushDataToClipboard = async () => {
  //   await window.navigator.clipboard.writeText(JSON.stringify(data));
  // };

  // const text = `${uid} (${type}) :: ${name}`;
  // const factTableRows = facts.map((fact) => {
  //   return (
  //     <TableRow>
  //       <TableCell>
  //         <Typography size="10px">{fact.lh_object_name}</Typography>
  //       </TableCell>
  //       <TableCell>
  //         <Typography size="10px">{fact.rel_type_name}</Typography>
  //       </TableCell>
  //       <TableCell>
  //         <Typography size="10px">{fact.rh_object_name}</Typography>
  //       </TableCell>
  //     </TableRow>
  //   );
  // });

  // console.log("data: ", data);

  return (
    <Stack direction="column" spacing="1">
      {category}
      {specComp}
      <Box>
        <Typography size="18px" style={{ fontWeight: 800, color: "black" }}>
          {uid}:{name}
        </Typography>
      </Box>
      {synonyms &&
        synonyms.length > 0 &&
        synonyms.map((syn) => <div>{syn}</div>)}
      {defsComp}
      {catComp}
    </Stack>
  );
};

export default KindDetails;

{
  /*<Box>
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
            <Synonyms synonymFacts={synFacts} />
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

        {inverses && inverses.length > 0 && (
          <Box>
            <Typography size="12px" style={{ fontWeight: 600 }}>
              Inverses:
            </Typography>
            <Typography size="12px">{inverses.join(", ")}</Typography>
          </Box>
        )}

        {((reqRole1 && reqRole1.length > 0) ||
          (reqRole2 && reqRole2.length > 0)) && (
          <Box>
            <Typography size="12px" style={{ fontWeight: 600 }}>
              Required Roles:
            </Typography>
            <Typography size="12px">{reqRole1.join(", ")}</Typography>
            <Typography size="12px">{reqRole2.join(", ")}</Typography>
          </Box>
        )}

        {possRoles && possRoles.length > 0 && (
          <Box>
            <Stack direction="row" gap="xxsmall">
              <Typography
                size="12px"
                style={{ fontWeight: 600 }}
                onClick={loadAllPossRoles}
              >
                [x]
              </Typography>
              <Typography size="12px" style={{ fontWeight: 600 }}>
                Possible Roles:
              </Typography>
            </Stack>
            {possRoles.map((roleUID) => {
              //check if is one of known entities
              // if so return the entity name
              // otherwise just return the id with a link to load entity
              return <PossibleRole uid={roleUID} roleplayerUID={uid} />;
            })}
          </Box>
        )}

        {facts && facts.length > 0 && (
          <Box>
            <Typography size="12px" style={{ fontWeight: 600 }}>
              AllRelatedFacts:
            </Typography>
            {/*<TableContainer component={Paper}>
              <Table>
                <TableBody>{factTableRows}</TableBody>
              </Table>
            </TableContainer>*/
}
//       <WorkflowFactsVisualizer facts={facts} sparse={true} />
//     </Box>
//   )}
// </Box>*/}
