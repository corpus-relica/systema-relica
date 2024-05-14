import React, { useEffect, useState } from "react";
import { Checkmark, StatusGood, Close, StatusCritical } from "grommet-icons";
import { Collapsible, Box, Button, Text, TextArea } from "grommet";
import MenuButton from "./MenuButton";
import { useQuery, useMutation, MutationFunction } from "@tanstack/react-query";
import { useStores } from "../../context/RootStoreContext";
import { observer } from "mobx-react";
import { getEntityPrompt, postEntityPrompt } from "../../RLCBaseClient";

const CommitCancel = ({ handleOK, handleCancel }) => {
  return (
    <Box direction="row" align="center" gap="small" justify="end">
      <Button
        primary
        onClick={handleOK}
        icon={<Checkmark />}
        color="status-ok"
      />
      <Button
        onClick={handleCancel}
        icon={<Close />}
        plain={false}
        color="status-error"
      />
    </Box>
  );
};

const EntityPrompt: React.FC = observer(() => {
  const [value, setValue] = React.useState("");
  const [originalValue, setOriginalValue] = React.useState("");
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (xxx: { uid: number; prompt: string }) => {
      const { uid, prompt } = xxx;
      return postEntityPrompt(uid, prompt);
    },
    onSuccess: (data, variables, context) => {
      // console.log(data, variables, context);
      setValue(data);
      setOriginalValue(data);
    },
  });

  const { entityDataStore, graphViewStore } = useStores();

  const { entities } = entityDataStore;
  const { selectedNode } = graphViewStore;

  // Queries
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["entityPrompt", selectedNode],
    queryFn: getEntityPrompt,
    enabled: !!selectedNode,
  });

  useEffect(() => {
    // console.log(data);
    if (data) {
      setValue(data); // Assuming 'data' is the correct format to be displayed in TextArea
      setOriginalValue(data);
    } else {
      setValue("");
      setOriginalValue("");
    }
  }, [data]);

  if (isPending) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  const handleOK = () => {
    mutation.mutate({ uid: selectedNode, prompt: value });
  };
  const handleCancel = () => {
    setValue(data);
  };

  return (
    <>
      <MenuButton
        open={isOpen}
        label="Entity Prompt"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        submenu={null}
      />

      <Collapsible open={isOpen}>
        <Box
          pad="xxsmall"
          direction="column"
          gap="small"
          margin="none"
          basis={value !== "" ? "medium" : "xsmall"}
        >
          <TextArea
            fill
            size="xsmall"
            placeholder="type here"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          {value !== originalValue ? (
            <CommitCancel handleOK={handleOK} handleCancel={handleCancel} />
          ) : null}
        </Box>
      </Collapsible>
    </>
  );
});

export default EntityPrompt;
