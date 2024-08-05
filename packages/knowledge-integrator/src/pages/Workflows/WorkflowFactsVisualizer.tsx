import React, { useEffect, useState } from "react";
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

const WorkflowFactsVisualizer = (props: any) => {
  const { facts } = props;
  // const [svgstr, setSvgstr] = useState("");

  return (
    <ThemeProvider theme={theme}>
      <Stack>
        <Box>FactsVisualization</Box>
        {/*<Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            borderRadius: 2,
          }}
          dangerouslySetInnerHTML={{ __html: svgstr }}
        />*/}
        {facts &&
          facts.map((item: any, index: number) => {
            return <Box key={index}>{item}</Box>;
          })}
      </Stack>
    </ThemeProvider>
  );
};

export default WorkflowFactsVisualizer;
