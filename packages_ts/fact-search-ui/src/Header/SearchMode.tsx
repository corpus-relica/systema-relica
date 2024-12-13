import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCollections, performSearch } from "../axiosInstance";
import { useStores } from "../context/RootStoreContext";
import { observer } from "mobx-react-lite";
import { ALL } from "@relica/constants";
import { useDebounce } from "../utils";

import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Typography from "@mui/material/Typography";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

type CollectionsMenuData = {
  name: string;
  uid: string;
};

const SearchMode: React.FC = observer(() => {
  const rootStore = useStores();
  const pageSize = 50;
  const [collections, setCollections] = useState<CollectionsMenuData[]>([]);
  const [selectedColl, setSelectedColl] = useState({ name: ALL, uid: "" });
  const [selectedType, setSelectedType] = useState({ name: ALL });
  const [searchTerm, setSearchTerm] = useState(rootStore.initialQuery);
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [page, setPage] = useState(1);

  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: getCollections,
  });

  const { data: { facts, count } = { facts: [], count: 0 } } = useQuery({
    queryKey: ["search", debouncedSearchTerm, page],
    queryFn: () => {
      if (searchTerm !== "") {
        return performSearch(
          debouncedSearchTerm,
          page,
          pageSize,
          rootStore.filter
        );
      }
      return { facts: [], count: 0 };
    },
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (collectionsData) {
      setCollections(collectionsData);
    }
  }, [collectionsData]);

  useEffect(() => {
    rootStore.facts = facts;
  }, [facts]);

  const handleCollectionChange = (event: SelectChangeEvent<string>) => {
    const selectedUid = event.target.value;
    const selected = collections.find((c) => c.uid === selectedUid) || {
      name: ALL,
      uid: "",
    };
    setSelectedColl(selected);
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedType({ name: event.target.value });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      // Trigger search
    }
  };

  const incPage = () => {
    if (page * pageSize < count) {
      setPage(page + 1);
    }
  };

  const decPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <>
      <Grid item xs={12} sm={3}>
        {count > 0 && (
          <Box display="flex" alignItems="center">
            <IconButton onClick={decPage} disabled={page === 1}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="body2" sx={{ mx: 1 }}>
              {page * pageSize - (pageSize - 1)} -{" "}
              {Math.min(page * pageSize, count)} of {count}
            </Typography>
            <IconButton onClick={incPage} disabled={page * pageSize >= count}>
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        )}
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          placeholder="Search..."
          InputProps={{
            endAdornment: (
              <IconButton>
                <SearchIcon />
              </IconButton>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Typography variant="caption">Entity Type</Typography>
        <Select fullWidth value={selectedType.name} onChange={handleTypeChange}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="kind">Kind</MenuItem>
          <MenuItem value="individual">Individual</MenuItem>
        </Select>
      </Grid>
      <Grid item xs={12} sm={3}>
        <Typography variant="caption">Collection of Facts</Typography>
        <Select
          fullWidth
          value={selectedColl.uid}
          onChange={handleCollectionChange}
        >
          <MenuItem value="">All</MenuItem>
          {collections.map((item) => (
            <MenuItem key={item.uid} value={item.uid}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
      </Grid>
    </>
  );
});

export default SearchMode;
