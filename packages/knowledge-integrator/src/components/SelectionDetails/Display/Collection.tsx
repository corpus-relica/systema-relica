import React, { useContext, useState, useEffect } from "react";
import { Checkmark, Close, Edit } from "grommet-icons";
import { Box, Button, Text, TextArea, Select } from "grommet";
import { observer } from "mobx-react";
import { updateModelCollection } from "../../../CCClient";
import { useQuery } from "@tanstack/react-query";

interface Def {
  fact_uid: number;
  partial_definition: string;
  full_definition: string;
}

interface CollectionProps {
  uid: number;
  collection: { uid: number; name: string };
}

const Collection: React.FC<CollectionProps> = observer(
  ({ uid, collection }) => {
    // const { semanticModelStore } = useContext(RootStoreContext);
    const [isEditing, setIsEditing] = useState(false);
    const [newCollUID, setNewCollUID] = useState(collection.uid);
    const [newCollName, setNewCollName] = useState(collection.name);

    const [displayName, setDisplayName] = useState(collection.name);

    const {
      isPending,
      isError,
      data: collectionItems,
      error,
    } = useQuery({
      queryKey: ["collections"],
      queryFn: async () => {
        const res = await fetch(
          "http://localhost:3000/retrieveEntity/collections",
        );
        return res.json();
      },
    });

    useEffect(() => {
      if (isEditing) {
        // setNewFullDef(definitions[currDefIdx].full_definition);
        // setNewPartialDef(definitions[currDefIdx].partial_definition);
      }
    }, [isEditing]);

    const submitColl = async () => {
      const result = await updateModelCollection(uid, newCollUID, newCollName);

      console.log("RESULT !!! ------");
      console.log(result);

      // TODO: this is a hack, in reality we need to complete the round trip on the update; show the actual updated definition state
      // definitions[currDefIdx].partial_definition = newPartialDef;
      // definitions[currDefIdx].full_definition = newFullDef;

      setDisplayName(result.collection_name);
      setIsEditing(false);
    };

    const comp = isEditing ? (
      <Box gap="xsmall">
        {/*<Text size="12px" style={{ fontWeight: 500 }} margin="small">
        partial_definition:
      </Text>
      <TextArea
        size="10px"
        plain
        fill
        value={newPartialDef}
        onChange={(e: any) => {
          setNewPartialDef(e.target.value);
        }}
      />
      <Text size="12px" style={{ fontWeight: 500 }}>
        full_definition:
      </Text>
      <TextArea
        size="10px"
        plain
        fill
        value={newFullDef}
        onChange={(e: any) => {
          setNewFullDef(e.target.value);
        }}
      />*/}
        <Select
          options={
            collectionItems && collectionItems.length > 0
              ? collectionItems.concat([{ name: "None", uid: 0 }]).map(
                  (item: any) => item.name,
                  // <MenuItem key={item.uid} value={item.uid}>
                  //   {item.name}
                  // </MenuItem>
                )
              : []
          }
          value={newCollName}
          onChange={({ option }) => {
            if (option === "None") {
              setNewCollName("None");
              setNewCollUID(0);
              return;
            }
            const coll = collectionItems.find((x: any) => x.name === option);
            setNewCollName(coll.name);
            setNewCollUID(coll.uid);
          }}
        />
        <Box
          direction="row-reverse"
          gap="small"
          alignContent="end"
          border
          basis="full"
        >
          <Button icon={<Checkmark />} onClick={submitColl} />
          <Button
            icon={<Close />}
            onClick={() => {
              setIsEditing(false);
            }}
          />
        </Box>
      </Box>
    ) : (
      <Box gap="xsmall">
        <Text size="12px" style={{ fontWeight: 500 }}>
          collection:
        </Text>
        <Text size="10px">{displayName}</Text>
      </Box>
    );

    return (
      <Box margin={{ vertical: "xsmall" }}>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} icon={<Edit />} />
        )}
        {comp}
      </Box>
    );
  },
);

export default Collection;
