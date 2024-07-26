import React, { useState } from "react";
import { Layout } from "react-admin";
import { Slide, IconButton } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { MyMenu } from "./MyMenu";
import { MyAppBar } from "./MyAppBar";
import LispREPL from "./LispREPL";

const replHeight = "40vh"; // Adjust as needed

export const MyLayout = (props) => {
  const [replOpen, setReplOpen] = useState(false);

  const toggleRepl = () => {
    setReplOpen(!replOpen);
  };

  return (
    <Layout {...props} appBar={MyAppBar} menu={MyMenu}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        {props.children}
        <Slide direction="up" in={replOpen} mountOnEnter unmountOnExit>
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: replHeight,
              backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent background
              backdropFilter: "blur(5px)", // Adds a blur effect to the background
              display: "flex",
              flexDirection: "column",
              zIndex: 1300, // Ensure it's above other content
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px",
                color: "white",
              }}
            >
              <span>Lisp REPL</span>
              <IconButton onClick={toggleRepl} color="inherit">
                <ExpandMore />
              </IconButton>
            </div>
            <div style={{ flexGrow: 1, overflow: "auto" }}>
              <LispREPL />
            </div>
          </div>
        </Slide>
        <IconButton
          color="primary"
          aria-label="open repl"
          onClick={toggleRepl}
          sx={{
            position: "fixed",
            left: "50%",
            bottom: replOpen ? replHeight : 0,
            transform: "translateX(-50%)",
            zIndex: 1301,
            backgroundColor: (theme) => theme.palette.background.paper,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
          }}
        >
          {replOpen ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </div>
    </Layout>
  );
};
