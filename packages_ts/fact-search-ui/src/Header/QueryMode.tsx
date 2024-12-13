import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { performQuery } from "../axiosInstance";
import { useStores } from "../context/RootStoreContext";
import { observer } from "mobx-react-lite";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import QueryResults from "./QueryResultsDisplay";
import { useDebounce } from "../utils";
import IconButton from "@mui/material/IconButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface QueryModeProps {
  readonly?: boolean;
  autoload?: boolean;
}

const QueryMode: React.FC<QueryModeProps> = observer(
  ({ readonly = false, autoload = false }) => {
    const rootStore = useStores();
    const pageSize = 50;
    const [queryTerm, setQueryTerm] = useState(
      rootStore.initialQuery ||
        '@intention="question"\n?12.foobar > 1190 > 1000000235\n?2.bazquux > 1190 > ?12.foobar'
    );
    const debouncedQueryTerm = useDebounce(queryTerm, 250);
    const [page, setPage] = useState(1);

    const {
      data: { facts, groundingFacts, vars, totalCount } = {
        groundingFacts: [],
        facts: [],
        vars: [],
        totalCount: 0,
      },
    } = useQuery({
      queryKey: ["query", debouncedQueryTerm, page],
      queryFn: () => {
        if (queryTerm !== "") {
          return performQuery(debouncedQueryTerm, page, pageSize);
        }
        return { facts: [], count: 0 };
      },
      placeholderData: (previousData) => previousData,
    });

    useEffect(() => {
      rootStore.facts = facts;
    }, [facts]);

    useEffect(() => {
      rootStore.queryResult = { facts, groundingFacts, vars };
    }, [facts, vars]);

    const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setQueryTerm(event.target.value);
    };

    // const executeQuery = async () => {
    //   const res = await performQuery(queryTerm);
    //   rootStore.facts = res.facts;
    //   rootStore.queryResult = res;
    // };

    const handleKeyDown = async (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (event.key === "Enter" && !event.shiftKey) {
        // event.preventDefault();
        // // Execute query
        // console.log("Executing query:", queryTerm);
        // await executeQuery();
      }
    };

    // useEffect(() => {
    //   if (autoload && queryTerm !== "") {
    //     executeQuery();
    //   }
    // }, []);

    const incPage = () => {
      if (page * pageSize < totalCount) {
        setPage(page + 1);
      }
    };

    const decPage = () => {
      if (page > 1) {
        setPage(page - 1);
      }
    };

    console.log("QueryMode render");
    console.log("QueryTerm:", queryTerm);
    console.log("Facts:", facts);
    console.log("Count:", totalCount);
    console.log("Page:", page);
    console.log("DebouncedQueryTerm:", debouncedQueryTerm);
    console.log("Autoload:", autoload);
    console.log("Readonly:", readonly);
    console.log("RootStore:", rootStore);
    console.log("-----------------");
    // console.log("RootStore FACTS:", rootStore.facts.length);
    return (
      <>
        <Grid item xs={12} sm={3}>
          {totalCount > 0 && (
            <Box display="flex" alignItems="center">
              <IconButton onClick={decPage} disabled={page === 1}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="body2" sx={{ mx: 1 }}>
                {page * pageSize - (pageSize - 1)} -{" "}
                {Math.min(page * pageSize, totalCount)} of {totalCount}
              </Typography>
              <IconButton
                onClick={incPage}
                disabled={page * pageSize >= totalCount}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Box>
          )}
        </Grid>
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
      </>
    );
  }
);

export default QueryMode;
