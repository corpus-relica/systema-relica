import { Box, Text } from "grommet";
//@ts-ignore
import { Fact } from "@relica/types";

const columns = [
  {
    property: "lh_object_uid",
    header: "uid",
    size: "xsmall",
    render: (datum: Fact) => (
      <>
        {/* @ts-ignore */}
        <Text
          size="14px"
          onClick={() => {
            console.log("clicked something??");
          }}
        >
          {/* @ts-ignore */}
          <Box>{datum["lh_object_uid"]}</Box>
        </Text>
      </>
    ),
  },
  {
    property: "lh_object_name",
    header: "lh_object_name",
    size: "medium",
    render: (datum: Fact) => (
      <>
        {/* @ts-ignore */}
        <Text
          size="14px"
          onClick={() => {
            console.log("clicked something??");
          }}
        >
          {/* @ts-ignore */}
          <Box>{datum["lh_object_name"]}</Box>
        </Text>
      </>
    ),
  },
  {
    property: "rel_type_name",
    header: "rel_type",
    size: "small",
    render: (datum: Fact) => (
      <>
        {/* @ts-ignore */}
        <Text
          size="14px"
          onClick={() => {
            console.log("clicked something??");
          }}
        >
          {/* @ts-ignore */}
          <Box>{datum["rel_type_name"]}</Box>
        </Text>
      </>
    ),
  },
  {
    property: "rh_object_name",
    header: "rh_object_name",
    size: "medium",
    render: (datum: Fact) => (
      <>
        {/* @ts-ignore */}
        <Text
          size="14px"
          onClick={() => {
            console.log("clicked something??");
          }}
        >
          {/* @ts-ignore */}
          <Box>{datum["rh_object_name"]}</Box>
        </Text>
        {/* @ts-ignore */}
      </>
    ),
  },
  {
    property: "collection_name",
    header: "collection_name",
    size: "small",
    render: (datum: Fact) => (
      <>
        {/* @ts-ignore */}
        <Text size="14px">
          {/* @ts-ignore */}
          <Box>{datum["collection_name"]}</Box>
        </Text>
      </>
    ),
  },
];

export default columns;
