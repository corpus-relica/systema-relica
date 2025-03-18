#!/usr/bin/env python3
from datetime import datetime
# from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import ToolNode
from langchain_core.messages import AIMessage

from src.relica_nous_langchain.agent.Common import (
    # openAIModel,
    anthropicModel,
    format_chat_history,
    )
from src.relica_nous_langchain.agent.Templates import FULL_TEMPLATES
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    tools,
    )

# from src.relica_nous_langchain.services.CCComms import ccComms
from src.relica_nous_langchain.SemanticModel import semantic_model

# Create a ToolNode instance with your tools
tool_node = ToolNode(tools)

# Set up the model with tools
action_llm = ChatAnthropic(
    model=anthropicModel,
    temperature=0,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    stop=['\nObservation',
          '\nFinal Answer',
          '\nThought',
          '\nAction']
    ).bind_tools(tools)

async def action(state):
    messages = state['messages']
    messages_str = "\n".join([msg["content"] for msg in messages])
    input = state['input']
    print("/////////////////// ACTION BEGIN /////////////////////")
    prompt = FULL_TEMPLATES["action"].format(
        curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        semantic_model=semantic_model.getModelRepresentation(semantic_model.selectedEntity),
        context=semantic_model.context,
        tools=converted_tools,
        tool_descriptions=tool_descriptions,
        tool_names=tool_names,
        agent_scratchpad=f"{messages_str}\n",
        chat_history=format_chat_history(state['messages'])  # Use state instead of memory
    )

    # Invoke the model with the prompt
    response = action_llm.invoke([("system", prompt), ("human", input)])
    print("/////////////////// ACTION RESPONSE START /////////////////////")
    print(response)

    # Handle the case when no tool is called
    if not response.tool_calls:
        return {
            "messages": ["Action: No action taken"],
            "action_name": "none",
            "action_arguments": {},
            "tool_response": "No action was taken"
        }

    # Get the tool call information
    tool_call = response.tool_calls[0]
    action_name = tool_call["name"]
    action_arguments = tool_call["args"]

    # Special case for cutting to final answer
    if action_name == "cutToFinalAnswer":
        return {
            "cut_to_final": True,
            "action_name": action_name,
            "action_arguments": action_arguments,
            "tool_response": "Cut to final answer requested",
            "messages": [
                {"role": "assistant", "content": f"Action: {action_name}"},
                {"role": "assistant", "content": f"Action Input: {action_arguments}"}
            ]
        }

    # Create an AIMessage with tool_calls to pass to the ToolNode
    ai_message = AIMessage(
        content="",
        tool_calls=[
            {
                "name": action_name,
                "args": action_arguments,
                "id": tool_call.get("id", "tool_call_id"),  # Use the id from the response or a default
                "type": "tool_call",
            }
        ],
    )

    # Invoke the ToolNode with the AIMessage
    tool_result = await tool_node.ainvoke({"messages": [ai_message]})

    # Extract the tool response from the result
    tool_messages = tool_result.get("messages", [])
    tool_response = tool_messages[0].content if tool_messages else "No response from tool"

    print("/////////////////// ACTION RESPONSE END /////////////////////")

    return {
        "cut_to_final": False,
        "messages": [
            {"role": "assistant", "content": f"Action: {action_name}"},
            {"role": "assistant", "content": f"Action Input: {action_arguments}"},
            {"role": "assistant", "content": f"Tool Response: {tool_response}"}
        ]
    }
