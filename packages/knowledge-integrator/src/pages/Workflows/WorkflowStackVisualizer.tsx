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

const WorkflowStackVisualizer = (props: any) => {
  const { stack } = props;
  const [svgstr, setSvgstr] = useState("");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
    });

    const init = async () => {
      const drawDiagram = async function () {
        if (!stack || stack.length === 0) return;

        let graphDefinition = "graph TB\n"; //a-->b";
        stack.push("e");
        for (let i = 0; i < stack.length - 1; i++) {
          graphDefinition += `${stack[i]}-->${stack[i + 1]}\n`;
        }
        console.log(graphDefinition);

        const { svg } = await mermaid.render("graphDiv", graphDefinition);
        setSvgstr(svg);
      };
      await drawDiagram();
    };
    init();
  }, [stack]);

  return (
    <ThemeProvider theme={theme}>
      <Stack>
        <Box>StackVisualization</Box>
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

export default WorkflowStackVisualizer;
