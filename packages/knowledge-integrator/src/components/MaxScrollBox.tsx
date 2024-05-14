import { useEffect, useRef } from "react";
import { Box } from "grommet";

const MaxScrollBox = ({ content, gap = "xxsmall", pad = "xxsmall" }) => {
  const boxRef = useRef(null);

  useEffect(() => {
    const currentBox = boxRef.current;
    if (currentBox) {
      // Always scroll to the bottom when content updates
      currentBox.scrollTop = currentBox.scrollHeight;
    }
  }, [content]);

  return (
    <Box
      ref={boxRef}
      overflow="auto"
      gap={gap}
      pad={pad}
      fill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      {content}
    </Box>
  );
};

export default MaxScrollBox;
