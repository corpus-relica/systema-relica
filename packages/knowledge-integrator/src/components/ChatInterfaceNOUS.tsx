import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Box,
  Button,
  Text,
  TextArea,
  Paragraph,
  Markdown,
  List,
} from "grommet";
import { observer } from "mobx-react";
import MaxScrollBox from "./MaxScrollBox";
//@ts-ignore
import { SPECIALIZATION_HIERARCHY_ENDPOINT } from "@relica/constants";
import { getSpecializationHierarchy } from "../RLCBaseClient";
import { nousSocket, sockSendNous } from "../socket";
import RootStoreContext from "../context/RootStoreContext";

interface EntMeta {
  name: string;
  def?: string; // def is optional
}

const createMessage = (role, content) => ({
  role,
  content,
});

const ChatInterface = observer(() => {
  const { factDataStore, semanticModelStore } = useContext(RootStoreContext);

  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [displayMessages, setDisplayMessages] = useState([]);
  const [sockConnected, setSockConnected] = useState(false);

  const allKnownFacts = [];

  useEffect(() => {
    function onConnect() {
      setSockConnected(true);
      console.log("NOUS :: CONNECTED SOCKET>IO!!!");
    }

    function onDisconnect() {
      setSockConnected(false);
      console.log("NOUS :: DISCONNECTED SOCKET>IO!!!");
    }

    function onMessage(d) {
      console.log("MESSAGE RECEIVED", d);
      setMessages((prevMessages) => [...prevMessages, d]);
    }

    function onChatHistory(d) {
      console.log("CHAT HISTORY RECEIVED", d);
      setMessages(d);
    }

    function onThoughtHistory(d) {
      console.log("THOUGHT HISTORY RECEIVED", d);
    }

    function onFinalAnswer(d) {
      console.log("FINAL ANSWER RECEIVED", d);
      setDisplayMessages((prevMessages) => [...prevMessages, d]);
    }

    nousSocket.on("connect", onConnect);
    nousSocket.on("disconnect", onDisconnect);
    nousSocket.on("message", onMessage);
    nousSocket.on("chatHistory", onChatHistory);
    nousSocket.on("thoughtHistory", onThoughtHistory);
    nousSocket.on("final_answer", onFinalAnswer);

    return () => {
      nousSocket.off("connect", onConnect);
      nousSocket.off("disconnect", onDisconnect);
      nousSocket.off("message", onDisconnect);
    };
  }, []);

  const handleSend = async () => {
    setUserMessage("");

    const msg = createMessage("user", userMessage);

    sockSendNous("user", userMessage);
    setMessages((prevMessages) => [...prevMessages, msg]);
    // setUserInput("");
    setDisplayMessages((prevMessages) => [...prevMessages, msg]);
  };

  const handleSendAgain = async () => {
    // iterate through messages back to front
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        const rawContent = messages[i].content;
        const content = rawContent.replace("Question: ", "");
        const msg = createMessage("user", content);
        sockSendNous("user", content);
        setMessages((prevMessages) => [...prevMessages, msg]);
        setDisplayMessages((prevMessages) => [...prevMessages, msg]);
        break;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <Box flex={false} basis="full" direction="column">
      <Box flex={true}>
        <Box basis="1/3" background={"black"}>
          <Box align="end">
            <Text color={sockConnected ? "green" : "red"} size="xsmall">
              {sockConnected ? "[NOUS connected]" : "[NOUS disconnected]"}
            </Text>
          </Box>
          <MaxScrollBox
            content={messages.map((x) => {
              let color = "black";
              switch (x.role) {
                case "user":
                  color = "accent-4";
                  break;
                case "assistant":
                  if (x.content.startsWith("Observation")) {
                    color = "graph-1";
                  } else if (x.content.startsWith("Thought")) {
                    color = "#B2D5E1";
                  } else if (x.content.startsWith("Final")) {
                    color = "graph-1";
                  } else {
                    color = "graph-3";
                  }
                  break;
                case "system":
                  color = "graph-4";
                  break;
                default:
                  break;
              }
              return (
                <Box flex="grow" style={{ fontFamily: "monospace" }}>
                  <Text size="xsmall" color={color}>
                    {x.content}
                  </Text>
                </Box>
              );
            })}
          />
        </Box>
        <Box basis="2/3" background={"background-contrast"}>
          <MaxScrollBox
            gap="xsmall"
            content={displayMessages.map((x) => {
              let color = "black";
              switch (x.role) {
                case "user":
                  color = "dark-1";
                  break;
                case "assistant":
                  color = "graph-3";
                  break;
                default:
                  color = "red";
                  break;
              }
              const content = x.content.replace("Final Answer: ", "");
              return (
                <Box flex="grow" pad="xxsmall" direction="column" gap="xxsmall">
                  <Text weight="bold" size="small" color={color}>
                    {x.role}:
                  </Text>
                  <Text size="small" color={color}>
                    <Markdown>{content}</Markdown>
                  </Text>
                </Box>
              );
            })}
          />
        </Box>
      </Box>
      <Box flex={false} direction="row" gap="xsmall" pad="xsmall">
        <Box flex="grow">
          <TextArea
            value={userMessage}
            size="small"
            focusIndicator={false}
            onChange={(e) => {
              setUserMessage(e.target.value);
            }}
            onKeyPress={handleKeyPress}
          />
        </Box>
        <Box flex={false} gap="xsmall">
          <Button label="send" onClick={handleSend} pad="xsmall" />
          <Button label="send again" onClick={handleSendAgain} pad="xsmall" />
        </Box>
      </Box>
    </Box>
  );
});

export default ChatInterface;
