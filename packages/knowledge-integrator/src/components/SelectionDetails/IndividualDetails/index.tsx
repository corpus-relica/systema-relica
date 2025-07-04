import React, { useContext, useState, useEffect } from "react";
import { useStore } from "react-admin";
import { useQuery } from "@tanstack/react-query";

// import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
// import IconButton from "@mui/material/IconButton";
// import CopyAllIcon from "@mui/icons-material/FileCopy";

// import Collection from "./display/Collection";
// import IndividualName from "../display/IndividualName";
import Classification from "../display/Classification";
// import Value from "../display/Value";
// import Definition from "../display/Definition";
// import WorkflowFactsVisualizer from "../../pages/Workflows/WorkflowFactsVisualizer";
// import Synonyms from "../display/Synonyms";

import {retrieveIndividualModel} from "../../../CCClient.js";

import IndividualPhysicalObjectDetails from "./PhysicalObject.js"
import IndividualAspectDetails from "./Aspect.js"
// import RoleKindDetails from "./Role.js"
import IndividualRelationDetails from "./Relation.js"
import IndividualOccurrenceDetails from "./Occurrence.js"

const IndividualDetails: React.FC = () => {
  const [selectedNode] = useStore("selectedNode");

  const { isLoading, error, data } = useQuery({
    queryKey: ["individualModel", selectedNode],
    queryFn: () =>
      selectedNode
        ? retrieveIndividualModel(selectedNode).then((res) => res)
        : Promise.resolve(null),
    enabled: !!selectedNode, // This disables the query if selectedNode is null
  });

  if (isLoading || !selectedNode) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const { uid, name, nature, category, classifiers, } = data;

  const classComp = <Classification uids={classifiers} individualUID={uid}/>

  let catComp;
  switch(category){
      case "physical object":
        catComp = <IndividualPhysicalObjectDetails {...data}/>
      break;
      case "aspect":
        catComp = <IndividualAspectDetails {...data}/>
      break;
      // case "role":
      //   catComp = <RoleIndividualDetails {...data}/>
      // break;
      case "relation":
        catComp = <IndividualRelationDetails {...data}/>
      break;
      case "occurrence":
        catComp = <IndividualOccurrenceDetails {...data}/>
      break;
      default:
        catComp = <div>Unknown Entity Category: {category}</div>
      break;
  }
  // const classFact = facts.find((fact) => fact.rel_type_uid === 1225);
  // const synFacts = facts.filter((fact) => fact.rel_type_uid === 1981);

  // const specialization = data[1146];
  // const classification = data[1225];
  // const synonyms = data[1981];
  // const inverses = data[1986];
  // const reqRole1 = data[4731];
  // const reqRole2 = data[4733];
  // const possRoles = data[4714];

  const pushDataToClipboard = async () => {
    await window.navigator.clipboard.writeText(JSON.stringify(data));
  };

  return (
    <Stack direction="column" spacing="1">
      {classComp}
      <Box>
        <Typography size="18px" style={{ fontWeight: 800, color: "black" }}>
          {uid}:{name}
        </Typography>
      </Box>
      {catComp}
    </Stack>
  );

  // return (
  //   <Grid container xs={12} direction="row">
  //   </Grid>
  // );
};

export default IndividualDetails;

      // <Grid item xs={12}>
      //   <Typography size="18px" style={{ fontWeight: 800 }}>
      //     {uid}
      //   </Typography>
      //   <IndividualName uid={classFact.fact_uid} name={name} />
      //   <Synonyms synonymFacts={synFacts} />
      //   <Collection uid={definition[0].fact_uid} collection={collection} />
      //   <Typography size="12px" style={{ fontWeight: 500 }}>
      //     {classification && classification.length > 0
      //       ? `Classification:`
      //       : "error, concept seemingly not classified"}
      //   </Typography>
      //   {classification && classification.length > 0 ? (
      //     <Classification uids={classification} individualUID={uid} />
      //   ) : (
      //     "error, concept seemingly not classified"
      //   )}
      //   {value && <Value value={value} />}
      //   {definition && <Definition definitions={definition} />}
      // </Grid>
      // <Grid
      //   item
      //   xs={12}
      //   border={1}
      //   borderRadius={2}
      //   borderColor={"orange"}
      //   margin={1}
      // >
      //   <IconButton onClick={pushDataToClipboard}>
      //     <CopyAllIcon />
      //   </IconButton>
      // </Grid>

      // {facts && facts.length > 0 && (
      //   <Box>
      //     <Typography size="12px" style={{ fontWeight: 600 }}>
      //       AllRelatedFacts:
      //     </Typography>
      //     {/*<TableContainer component={Paper}>
      //         <Table>
      //           <TableBody>{factTableRows}</TableBody>
      //         </Table>
      //       </TableContainer>*/}
      //     <WorkflowFactsVisualizer facts={facts} sparse={true} />
      //   </Box>
      // )}
