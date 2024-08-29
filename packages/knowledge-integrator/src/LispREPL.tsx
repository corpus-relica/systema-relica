import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { ccSocket } from "./socket";

const highlightSyntax = (code: any) => {
  const keywords = ["def!", "defun", "lambda", "if", "cond", "let"];
  const specialChars = ["(", ")", "[", "]"];

  return code
    .split(" ")
    .map((token: any) => {
      if (keywords.includes(token)) {
        return `\x1b[33m${token}\x1b[0m`; // Yellow for keywords
      } else if (specialChars.includes(token)) {
        return `\x1b[36m${token}\x1b[0m`; // Cyan for special characters
      } else if (!isNaN(token)) {
        return `\x1b[32m${token}\x1b[0m`; // Green for numbers
      }
      return token; // Default color for other tokens
    })
    .join(" ");
};

const LispREPL = () => {
  const terminalRef = useRef(null);
  const terminal: any = useRef(null);
  const inputBuffer = useRef("");
  const commandHistory = useRef([]);
  const historyIndex = useRef(-1);

  useEffect(() => {
    if (!terminal === null) return;
    terminal.current = new Terminal({
      fontFamily: '"Fira Code", Menlo, monospace',
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: "#2b2b2b",
        foreground: "#f8f8f2",
      },
    });

    const fitAddon = new FitAddon();
    terminal.current.loadAddon(fitAddon);

    terminal.current.open(terminalRef.current);
    fitAddon.fit();

    terminal.current.writeln("Lisp REPL");
    terminal.current.write("lisp> ");

    terminal.current.onKey(({ key, domEvent }) => {
      const printable =
        !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.keyCode === 13) {
        // Enter
        handleEnter();
      } else if (domEvent.keyCode === 8) {
        // Backspace
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          terminal.current.write("\b \b");
        }
      } else if (domEvent.keyCode === 38) {
        // Up arrow
        navigateHistory(-1);
      } else if (domEvent.keyCode === 40) {
        // Down arrow
        navigateHistory(1);
      } else if (printable) {
        inputBuffer.current += key;
        terminal.current.write(key);
      }
    });

    return () => {
      terminal.current.dispose();
    };
  }, [terminal]);

  const handleEnter = async () => {
    terminal.current.writeln("");
    console.log(inputBuffer.current);
    console.log(inputBuffer.current.startsWith("("));
    if (inputBuffer.current === "" || !inputBuffer.current.startsWith("(")) {
      inputBuffer.current = "";
      // terminal.current.write("lisp> ");
    } else if (isBalancedParentheses(inputBuffer.current)) {
      // Here you would evaluate the Lisp expression
      terminal.current.writeln(`Evaluating: ${inputBuffer.current}`);
      commandHistory.current.push(inputBuffer.current);
      historyIndex.current = commandHistory.current.length;
      console.log(inputBuffer.current);
      ccSocket.emit(
        "repl:eval",
        {
          command: inputBuffer.current,
        },
        (res: string) => {
          console.log("ERM....", res);
        }
      );
      inputBuffer.current = "";
    } else {
      // Continue input on a new line
      terminal.current.write("... ");
    }
    if (inputBuffer.current === "") {
      terminal.current.write("lisp> ");
    }
  };

  const navigateHistory = (direction) => {
    historyIndex.current += direction;
    if (historyIndex.current < 0) historyIndex.current = 0;
    if (historyIndex.current >= commandHistory.current.length) {
      historyIndex.current = commandHistory.current.length;
      inputBuffer.current = "";
    } else {
      inputBuffer.current = commandHistory.current[historyIndex.current];
    }
    terminal.current.write("\r\x1B[K" + "lisp> " + inputBuffer.current);
  };

  const isBalancedParentheses = (code) => {
    let count = 0;
    for (let char of code) {
      if (char === "(") count++;
      if (char === ")") count--;
      if (count < 0) return false;
    }
    return count === 0;
  };

  return <div ref={terminalRef} style={{ height: "400px", width: "100%" }} />;
};

export default LispREPL;
