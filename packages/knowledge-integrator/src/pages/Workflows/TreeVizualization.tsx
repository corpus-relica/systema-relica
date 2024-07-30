import React, { useEffect, useState } from "react";
import mermaid from "mermaid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

const TreeVisualization = () => {
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
    <Stack>
      <Box>TreeVisualization</Box>
      <Box dangerouslySetInnerHTML={{ __html: svgstr }} />
    </Stack>
  );
};

export default TreeVisualization;
