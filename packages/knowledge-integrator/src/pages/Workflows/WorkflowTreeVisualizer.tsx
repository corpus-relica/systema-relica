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

const WorkflowTreeVisualizer = () => {
  const [svgstr, setSvgstr] = useState("");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
    });

    const init = async () => {
      const drawDiagram = async function () {
        const graphDefinition = "graph TB\na-->b";
        const { svg } = await mermaid.render("graphDiv", graphDefinition);
        setSvgstr(svg);
      };
      await drawDiagram();
    };
    init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Stack>
        <Box>TreeVisualization</Box>
        <Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            borderRadius: 2,
          }}
          dangerouslySetInnerHTML={{ __html: svgstr }}
        />
      </Stack>
    </ThemeProvider>
  );
};

export default WorkflowTreeVisualizer;
