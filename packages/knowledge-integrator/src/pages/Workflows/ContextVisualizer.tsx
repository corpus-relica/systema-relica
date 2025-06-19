import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ThemeProvider, createTheme } from "@mui/system";
import Grid from "@mui/material/Grid";

const theme = createTheme({
  palette: {
    background: {
      paper: "#fff",
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

const ContextVisualizer = (props: any) => {
  const { context } = props;

  return (
    <ThemeProvider theme={theme}>
      <Grid container spacing={0} padding={0}>
        <Grid xs={12}>
          <Box>ContextVisualization</Box>
        </Grid>
      </Grid>
      <Grid xs={12} spacing={0} padding={0}>
        {context &&
          Object.keys(context).map((key) => {
            return (
              <Grid
                key={key}
                style={{ fontSize: "12px" }}
                container
                spacing={0}
                padding={0}
              >
                <Grid xs={5} spacing={0}>
                  {key}:
                </Grid>
                <Grid xs={5} spacing={0}>
                  {context[key].uid}: {context[key].value}
                </Grid>
              </Grid>
            );
          })}
      </Grid>
    </ThemeProvider>
  );
};

export default ContextVisualizer;
