#!/usr/bin/env python3

from datetime import datetime
# from langchain_openai import  ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import ToolInvocation, ToolExecutor

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
from src.relica_nous_langchain.services.CCComms import ccComms
from src.relica_nous_langchain.SemanticModel import semanticModel

tool_executor = ToolExecutor(tools)

################################################################################## ACTION


# action_llm = ChatOpenAI(
#     model=openAIModel,
#     temperature=0,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['\nObservation',
#           '\nFinal Answer',
#           '\nThought',
#           '\nAction']
#     ).bind_tools(tools)

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
        semantic_model=semanticModel.getModelRepresentation(ccComms.selectedEntity),
        context=semanticModel.context,
        tools=converted_tools,
        tool_descriptions=tool_descriptions,
        tool_names=tool_names,
        agent_scratchpad=f"{messages_str}\n",
        chat_history=format_chat_history(state['messages'])  # Use state instead of memory
    )

    response = action_llm.invoke([("system", prompt), ("human", input)])

    print("/////////////////// ACTION RESPONSE START /////////////////////")
    print(response)

    if not response.tool_calls:
        return {
            # "action_taken": False,
            "messages": ["Action: No action taken"],
            "action_name": "none",
            "action_arguments": {},
            "tool_response": "No action was taken"
        }

    tool_call = response.tool_calls[0]
    action_name = tool_call["name"]
    action_arguments = tool_call["args"]

    if action_name == "cutToFinalAnswer":
        return {
            # "action_taken": True,
            "cut_to_final": True,
            "action_name": action_name,
            "action_arguments": action_arguments,
            "tool_response": "Cut to final answer requested",
            "messages": [
                {"role": "assistant", "content": f"Action: {action_name}"},
                {"role": "assistant", "content": f"Action Input: {action_arguments}"}
            ]
        }

    action = ToolInvocation(
        tool=action_name,
        tool_input=action_arguments,
    )

    tool_response = await tool_executor.ainvoke(action)

    # print(tool_call)
    # print(action_name)
    # print(action_arguments)
    # print(tool_response)

    print("/////////////////// ACTION RESPONSE END /////////////////////")

    return {
        "cut_to_final": False,
        "messages": [
            {"role": "assistant", "content": f"Action: {action_name}"},
            {"role": "assistant", "content": f"Action Input: {action_arguments}"},
            {"role": "assistant", "content": f"Tool Response: {tool_response}"}
        ]
    }
