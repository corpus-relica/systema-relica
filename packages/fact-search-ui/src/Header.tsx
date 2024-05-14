import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, DropButton, List, Text, TextInput } from "grommet";
import { getCollections, performSearch } from "./axiosInstance";
import { Search, Next, Previous } from "grommet-icons";
import { useStores } from "./context/RootStoreContext";
import { RootStore } from "./stores/RootStore";
import { observer } from "mobx-react-lite";
import { KIND, INDIVIDUAL, ALL } from "@relica/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "./utils";

type CollectionsMenuData = {
  name: string;
  uid: string;
};

const Header = observer(() => {
  const rootStore: RootStore = useStores();
  const pageSize = 50;
  const [collDropIsOpen, setCollDropIsOpen] = useState(false);
  const [typeDropIsOpen, setTypeDropIsOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionsMenuData[]>([]);
  const [selectedColl, setSelectedColl] = useState({ name: ALL, uid: "" });
  const [selectedType, setSelectedType] = useState({ name: ALL });
  const [searchTerm, setSearchTerm] = useState(rootStore.initialQuery);
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  queryClient.cancelQueries({ queryKey: ["search"], exact: true });

  const { data } = useQuery({
    queryKey: ["collections"],
    queryFn: getCollections,
  });

  // const count = 0;
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
    if (data) {
      setCollections(data);
    }
  }, [data]);

  // useEffect(() => {
  //   if (facts) {
  rootStore.facts = facts;
  //     // setTotalFacts(count);
  //   }
  // }, [facts]);

  const onSearchClick = function () {
    // performSearch();
  };

  const onCollectionItemClick = (event: {
    item?: { uid: string; name: string };
  }) => {
    if (event.item) {
      setSelectedColl(event.item);
      setCollDropIsOpen(false);
    }
  };

  const onTypeItemClick = (event: { item?: { name: string } }) => {
    if (event.item) {
      setSelectedType(event.item);
      setTypeDropIsOpen(false);
    }
  };

  const finalCollections = collections
    ? collections.concat([{ uid: "", name: ALL }])
    : [];
  const onCollDropOpen = () => {
    setCollDropIsOpen(true);
  };
  const onCollDropClose = () => {
    setCollDropIsOpen(false);
  };
  const onTypeDropOpen = () => {
    setTypeDropIsOpen(true);
  };
  const onTypeDropClose = () => {
    setTypeDropIsOpen(false);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // performSearch();
    }
  };

  const incPage = () => {
    if (page * pageSize <= count) {
      setPage(page + 1);
      // performSearch();
    }
  };

  const decPage = () => {
    if (page > 1) {
      setPage(page - 1);
      // performSearch();
    }
  };
  return (
    <Box
      align="center"
      justify="center"
      direction="row"
      fill="horizontal"
      gap="medium"
      basis="small"
    >
      {rootStore.filter ? (
        <Box>
          X {rootStore.filter.type} : {rootStore.filter.uid}{" "}
        </Box>
      ) : null}
      <Box>
        {count === 0 ? null : (
          <Box direction="row" align="center">
            <Box pad="xsmall">
              <Button
                icon={<Previous />}
                onClick={decPage}
                disabled={page === 1}
              />
            </Box>
            <Box pad="xsmall">
              <Text>
                {page * pageSize - (pageSize - 1)}
                {" - "}
                {Math.min(page * pageSize, count)} of {count}
              </Text>
            </Box>
            <Box pad="xsmall">
              <Button
                icon={<Next />}
                onClick={incPage}
                disabled={page * pageSize >= count}
              />
            </Box>
          </Box>
        )}
      </Box>
      <Box pad="large">
        <TextInput
          value={searchTerm}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
        />
      </Box>
      <Box direction="column">
        <Text size="small">Entity Type</Text>
        <DropButton
          label={selectedType ? selectedType.name : "select kind or individual"}
          open={typeDropIsOpen}
          onOpen={onTypeDropOpen}
          onClose={onTypeDropClose}
          dropContent={
            <Box>
              <List
                data={[{ name: ALL }, { name: KIND }, { name: INDIVIDUAL }]}
                onClickItem={onTypeItemClick}
              ></List>
            </Box>
          }
        />
      </Box>
      <Box direction="column">
        <Text size="small">Collection of Facts</Text>
        <DropButton
          label={selectedColl ? selectedColl.name : "select collection"}
          open={collDropIsOpen}
          onOpen={onCollDropOpen}
          onClose={onCollDropClose}
          dropContent={
            <Box>
              <List
                data={finalCollections}
                primaryKey="uid"
                secondaryKey="name"
                onClickItem={onCollectionItemClick}
              ></List>
            </Box>
          }
          dropProps={{ align: { top: "bottom" } }}
        />
      </Box>
      <Button label="" icon={<Search />} onClick={onSearchClick} />
    </Box>
  );
});

export default Header;
