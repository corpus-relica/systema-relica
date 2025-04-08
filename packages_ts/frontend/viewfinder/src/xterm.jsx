import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const XTerminal = ({ onData }) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);

  useEffect(() => {
    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      // Add more options as needed
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;

    // Handle terminal input
    term.onData((data) => {
      if (onData) {
        onData(data);
      }
    });

    // Clean up on unmount
    return () => {
      term.dispose();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const fitAddon = new FitAddon();
      terminalInstanceRef.current.loadAddon(fitAddon);
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Function to write to the terminal
  const writeToTerminal = (text) => {
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.write(text);
    }
  };

  return <div ref={terminalRef} style={{ height: "400px", width: "100%" }} />;
};

export default XTerminal;
