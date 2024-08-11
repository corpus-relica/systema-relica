import React, { useState } from "react";
import { performQuery } from "../axiosInstance";
import { useStores } from "../context/RootStoreContext";
import { observer } from "mobx-react-lite";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import QueryResults from "./QueryResultsDisplay";

const QueryMode: React.FC = observer(() => {
  const rootStore = useStores();
  const [queryTerm, setQueryTerm] = useState(
    '@intention="question"\n?12.foobar > 1190 > 1000000235\n?2.bazquux > 1190 > ?12.foobar'
  );

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQueryTerm(event.target.value);
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Execute query
      console.log("Executing query:", queryTerm);
      const res = await performQuery(queryTerm);
      rootStore.facts = res.facts;
      rootStore.queryResult = res;
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
        onKeyDown={handleKeyDown}
        placeholder="Enter your query here..."
      />
    </Grid>
  );
});

export default QueryMode;
