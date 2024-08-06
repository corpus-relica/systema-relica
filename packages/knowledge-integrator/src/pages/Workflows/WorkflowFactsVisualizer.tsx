import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ThemeProvider, createTheme } from "@mui/system";
import { styled } from "@mui/system";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import { Fact } from "../../types";

// Import the font file directly
// const CustomFontUrl = "./fonts/BMSPA___.TTF";
const CustomFontUrl = "./fonts/TTF/dogicapixel.ttf";

// Create a style tag to define the font
const FontStyle = styled("style")({
  "@font-face": {
    fontFamily: "dogicapixel",
    src: `url(${CustomFontUrl}) format('truetype')`,
    // fontWeight: "normal",
    // fontStyle: "normal",
  },
});

const theme = createTheme({
  typography: {
    fontFamily: "dogicapixel, Arial, sans-serif",
  },
  palette: {
    background: {
      paper: "#333",
    },
    text: {
      primary: "#173A5E",
      secondary: "#46505A",
    },
    action: {
      active: "#001E3C",
    },
    success: {
      dark: "#009688",
    },
  },
});

const PixelText = styled(Box)({
  fontFamily: "dogicapixel",
  fontSize: "8px",
  // whiteSpace: "pre-wrap",
  // wordBreak: "break-word",
});

const WorkflowFactsVisualizer = (props: { facts: string[] }) => {
  const { facts } = props;

  return (
    <>
      <FontStyle />
      <Stack spacing={1}>
        <Typography variant="h6">FactsVisualization</Typography>
        <Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            borderRadius: 2,
            overflow: "hidden",
            padding: 1,
          }}
        >
          <Grid container spacing={0.15}>
            {facts &&
              facts.map((item: Fact, index) => (
                <Grid
                  key={index}
                  container
                  xs={12}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#000C1A" : "#05183C",
                    color: "#cce",
                  }}
                >
                  <Grid xs={0.5}>
                    <PixelText key={index}>{item.fact_uid}</PixelText>
                  </Grid>
                  <Grid xs={0.5}>
                    <PixelText key={index}>{item.lh_object_uid}</PixelText>
                  </Grid>
                  <Grid xs={3}>
                    <PixelText key={index}>{item.lh_object_name}</PixelText>
                  </Grid>
                  <Grid xs={1}>
                    <PixelText key={index}>{item.rel_type_uid}</PixelText>
                  </Grid>
                  <Grid xs={3}>
                    <PixelText key={index}>{item.rel_type_name}</PixelText>
                  </Grid>
                  <Grid xs={1}>
                    <PixelText key={index}>{item.rh_object_uid}</PixelText>
                  </Grid>
                  <Grid xs={3}>
                    <PixelText key={index}>{item.rh_object_name}</PixelText>
                  </Grid>
                </Grid>
              ))}
          </Grid>
        </Box>
      </Stack>
    </>
  );
};

export default WorkflowFactsVisualizer;
