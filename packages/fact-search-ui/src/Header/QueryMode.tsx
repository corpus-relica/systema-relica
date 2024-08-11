import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";

const QueryMode: React.FC = observer(() => {
  const [queryTerm, setQueryTerm] = useState("");

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQueryTerm(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Execute query
    }
  };

  return (
    <Grid item xs={12}>
      <TextField
        fullWidth
        multiline
        rows={4}
        value={queryTerm}
        onChange={handleQueryChange}
        onKeyPress={handleKeyPress}
        placeholder="Enter your query here..."
      />
    </Grid>
  );
});

export default QueryMode;
