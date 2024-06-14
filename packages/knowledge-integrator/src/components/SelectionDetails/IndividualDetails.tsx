import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grommet,
  Table,
  TableRow,
  TableBody,
  TableCell,
  Text,
} from "grommet";
import { grommet } from "grommet/themes";
import { Copy as CopyIcon } from "grommet-icons";
import ErrorBoundary from "../ErrorBoundary";
import { useStores } from "../../context/RootStoreContext";
import { observer } from "mobx-react";
import { retrieveIndividualModel } from "../../CCClient";
import { useQuery } from "@tanstack/react-query";

import Specialization from "./Display/Specialization";
import Classification from "./Display/Classification";
import Value from "./Display/Value";
import Collection from "./Display/Collection";
import Definition from "./Display/Definition";

import PossibleRole from "./Display/PossibleRole";
import { sockSendCC } from "../../socket";

const IndividualDetails: React.FC = observer(() => {
  const { graphViewStore } = useStores();

  const { selectedNode } = graphViewStore;

  const { isLoading, error, data } = useQuery({
    queryKey: ["individualModel", selectedNode],
    queryFn: () =>
      selectedNode
        ? retrieveIndividualModel(selectedNode).then((res) => res)
        : Promise.resolve(null),
    enabled: !!selectedNode, // This disables the query if selectedNode is null
  });

  const customTheme = {
    ...grommet,
    dataTable: {
      ...grommet.dataTable,
      text: {
        size: "8px",
      },
    },
  };

  if (isLoading || !selectedNode) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  console.log("INDIVIDUAL DATA");
  console.log(data);

  const { uid, type, category, name, definition, facts, value, collection } =
    data;
  const specialization = data[1146];
  const classification = data[1225];
  const synonyms = data[1981];
  const inverses = data[1986];
  const reqRole1 = data[4731];
  const reqRole2 = data[4733];
  const possRoles = data[4714];

  const loadAllPossRoles = (uid) => {
    // possRoles.forEach((possRole) => {
    //   sockSendCC("user", "loadEntity", { uid: possRole });
    // });
  };

  const pushDataToClipboard = async () => {
    await window.navigator.clipboard.writeText(JSON.stringify(data));
  };

  const text = `${uid} (${type}) :: ${name}`;
  const factTableRows = facts.map((fact) => {
    return (
      <TableRow>
        <TableCell>
          <Text size="10px">{fact.lh_object_name}</Text>
        </TableCell>
        <TableCell>
          <Text size="10px">{fact.rel_type_name}</Text>
        </TableCell>
        <TableCell>
          <Text size="10px">{fact.rh_object_name}</Text>
        </TableCell>
      </TableRow>
    );
  });

  return (
    <ErrorBoundary>
      <Grommet theme={customTheme}>
        <Box
          direction="column"
          width="medium"
          gap="small"
          margin="none"
          pad="small"
        >
          <Box>
            <Box direction="row" align="center" justify="between">
              <Box>
                <Collection
                  uid={definition[0].fact_uid}
                  collection={collection}
                />
                <Text size="18px" style={{ fontWeight: 800 }}>
                  {text}
                </Text>
                <Text size="12px" style={{ fontWeight: 500 }}>
                  {classification && classification.length > 0
                    ? `Classification:`
                    : "error, concept seemingly not classified"}
                </Text>
                {classification && classification.length > 0 ? (
                  <Classification uids={classification} individualUID={uid} />
                ) : (
                  "error, concept seemingly not classified"
                )}
                {value && <Value value={value} />}
                {definition && <Definition definitions={definition} />}
              </Box>
              <Button
                icon={<CopyIcon />}
                onClick={pushDataToClipboard}
                hoverIndicator
              />
            </Box>

            {/*{category && (
              <Box direction="row" gap="xxsmall">
                <Text size="12px" style={{ fontWeight: 600 }}>
                  Category:
                </Text>
                <Text size="12px">{category}</Text>
              </Box>
            )}
            {definition && (
              <Box>
                <Text size="12px" style={{ fontWeight: 600 }}>
                  Definition:
                </Text>
                <Text size="12px">{definition}</Text>
              </Box>
            )}
            {synonyms && synonyms.length > 0 && (
              <Box>
                <Text size="12px" style={{ fontWeight: 600 }}>
                  Synonyms:
                </Text>
                <Text size="12px">{synonyms.join(", ")}</Text>
              </Box>
            )}
            {inverses && inverses.length > 0 && (
              <Box>
                <Text size="12px" style={{ fontWeight: 600 }}>
                  Inverses:
                </Text>
                <Text size="12px">{inverses.join(", ")}</Text>
              </Box>
            )}
            {((reqRole1 && reqRole1.length > 0) ||
              (reqRole2 && reqRole2.length > 0)) && (
                <Box>
                  <Text size="12px" style={{ fontWeight: 600 }}>
                    Required Roles:
                  </Text>
                  <Text size="12px">{reqRole1.join(", ")}</Text>
                  <Text size="12px">{reqRole2.join(", ")}</Text>
                </Box>
              )}
            {possRoles && possRoles.length > 0 && (
              <Box>
                <Box direction="row" gap="xxsmall">
                  <Text
                    size="12px"
                    style={{ fontWeight: 600 }}
                    onClick={loadAllPossRoles}
                  >
                    [x]
                  </Text>
                  <Text size="12px" style={{ fontWeight: 600 }}>
                    Possible Roles:
                  </Text>
                </Box>
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
                <Text size="12px" style={{ fontWeight: 600 }}>
                  AllRelatedFacts:
                </Text>
                <Table>
                  <TableBody>{factTableRows}</TableBody>
                </Table>
              </Box>
              )}*/}
          </Box>
        </Box>
      </Grommet>
    </ErrorBoundary>
  );
});

export default IndividualDetails;
