import React, { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Card, CardContent } from "@mui/material";
import { Title } from "react-admin";
import Button from "@mui/material/Button";

import { useStore } from "react-admin";

const OPEN_AI_API_KEY = "openai_api_key";
const ANTHROPIC_API_KEY = "anthropic_api_key";

const Settings = () => {
  const [openAIAPIKey, setOpenAIAPIKey] = useStore(OPEN_AI_API_KEY, "set key");
  const [anthropicAPIKey, setAnthropicAPIKey] = useStore(
    ANTHROPIC_API_KEY,
    "set key"
  );

  const [localOpenAIAPIKey, setLocalOpenAIAPIKey] = useState(openAIAPIKey);
  const [localAnthropicAPIKey, setLocalAnthropicAPIKey] =
    useState(anthropicAPIKey);

  const saveSettings = () => {
    setOpenAIAPIKey(localOpenAIAPIKey);
    setAnthropicAPIKey(localAnthropicAPIKey);
  };

  return (
    <Card>
      <Title title="Settings" />
      <CardContent>
        <Box display="flex" flexDirection="column" width="50%">
          <TextField
            label="OpenAI API Key"
            id="OpenAI_API_Key"
            variant="outlined"
            margin="normal"
            value={localOpenAIAPIKey}
            onChange={(e) => setLocalOpenAIAPIKey(e.target.value)}
          />
          <TextField
            label="Anthropic API Key"
            id="Anthropic_API_Key"
            variant="outlined"
            margin="normal"
            value={localAnthropicAPIKey}
            onChange={(e) => setLocalAnthropicAPIKey(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={saveSettings}>
            Save
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Settings;
