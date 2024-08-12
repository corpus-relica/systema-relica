import React, { useState, useEffect } from "react";
import { performQuery } from "../axiosInstance";
import { useStores } from "../context/RootStoreContext";
import { observer } from "mobx-react-lite";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import QueryResults from "./QueryResultsDisplay";

interface QueryModeProps {
  readonly?: boolean;
  autoload?: boolean;
}

const QueryMode: React.FC<QueryModeProps> = observer(
  ({ readonly = false, autoload = false }) => {
    const rootStore = useStores();
    const { initialQuery } = rootStore;
    const [queryTerm, setQueryTerm] = useState(
      initialQuery ||
        '@intention="question"\n?12.foobar > 1190 > 1000000235\n?2.bazquux > 1190 > ?12.foobar'
    );

    const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setQueryTerm(event.target.value);
    };

    const executeQuery = async () => {
      const res = await performQuery(queryTerm);
      rootStore.facts = res.facts;
      rootStore.queryResult = res;
    };

    const handleKeyDown = async (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        // Execute query
        console.log("Executing query:", queryTerm);
        await executeQuery();
      }
    };

    useEffect(() => {
      if (autoload && queryTerm !== "") {
        executeQuery();
      }
    }, []);

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
          disabled={readonly}
        />
      </Grid>
    );
  }
);

export default QueryMode;
