#!/usr/bin/env python3

from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from src.relica_nous_langchain.agent.Common import (
    anthropicModel,
    format_chat_history,
    ACTION_FINAL_ANSWER,
    ACTION_CONTINUE,
    )
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    tools,
    )

model = ChatAnthropic(
    model=anthropicModel,
    temperature=0,
    max_tokens=1500,
    timeout=None,
    max_retries=2,
)#.bind_tools(tools)

system_prompt = "You are a helpful bot named Fred."
memory = MemorySaver()
config = {"configurable": {"thread_id": "abc123"}}
graph = create_react_agent(model, tools=tools, prompt=system_prompt, checkpointer=memory)

# inputs = {"messages": [("user", "What's your name? And what's the weather in SF?")]}
# for s in graph.stream(inputs, stream_mode="values"):
#     message = s["messages"][-1]
#     if isinstance(message, tuple):
#         print(message)
#     else:
#         message.pretty_print()

async def handleInput(user_input: str):
    inputs = {"messages": [("user", user_input)]}
    print(f"-------------------- Processing user input: {user_input}")

    # Keep track of the last message to identify stream end
    last_message = None

    async for s in graph.astream(inputs, config=config, stream_mode="values"):
        message = s["messages"][-1]
        last_message = message

        # Check if the message is from the AI assistant
        if isinstance(message, tuple) and message[0] == "assistant":
            # This is a message from the AI assistant
            print(f"**AI Assistant**: {message[1]}")
        elif isinstance(message, tuple):
            # This is another type of tuple message (maybe user or system)
            print(f"**Message from {message[0]}**: {message[1]}")
        else:
            # This is likely a Message object or some other format
            print("Message object received:")
            message.pretty_print()

    # This will execute after the stream is complete
    print("Stream complete. Final message was:", last_message)
    return last_message
