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

  // useEffect(() => {
  //   mermaid.initialize({
  //     startOnLoad: false,
  //   });
  // }, []);

  // useEffect(() => {
  //   const init = async () => {
  //     const drawDiagram = async function () {
  //       if (!stack || stack.length === 0) return;

  //       let s = [...stack];
  //       let graphDefinition = "graph TB\n"; //a-->b";
  //       s.push("e");

  //       // for (let i = stack.length - 2; i >= 0; i--) {
  //       //   graphDefinition += `${stack[i]}-->${stack[i + 1]}\n`;
  //       // }
  //       for (let i = 0; i < s.length - 1; i++) {
  //         graphDefinition += `${s[i]}-->${s[i + 1]}\n`;
  //       }

  //       const { svg } = await mermaid.render("graphDiv", graphDefinition);
  //       setSvgstr(svg);
  //     };
  //     await drawDiagram();
  //   };
  //   init();
  // }, [stack]);

  return (
    <ThemeProvider theme={theme}>
      <Stack>
        <Box>StackVisualization</Box>
        {/*<Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            borderRadius: 2,
          }}
          dangerouslySetInnerHTML={{ __html: svgstr }}
        />*/}
        {stack &&
          stack.map((item: any, index: number) => {
            return <Box key={index}>{item}</Box>;
          })}
      </Stack>
    </ThemeProvider>
  );
};

export default WorkflowStackVisualizer;
