import React, { useEffect, useState } from "react";
import mermaid from "mermaid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ThemeProvider, createTheme } from "@mui/system";

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
      <Stack>
        <Box>ContextVisualization</Box>
        {context &&
          Object.keys(context).map((key) => {
            return (
              <Box key={key}>
                {key}: {context[key]}
              </Box>
            );
          })}
      </Stack>
    </ThemeProvider>
  );
};

export default ContextVisualizer;